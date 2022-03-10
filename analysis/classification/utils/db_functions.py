import streamlit as st
import pandas as pd
import numpy as np
from utils.helpers import user_dir, repo_dir, data_dir
import hydralit_components as hc
import time
from datetime import datetime
from google.cloud import bigquery
from google.oauth2 import service_account
from google.api_core.exceptions import Conflict, NotFound, Forbidden
# import pydata_google_auth
import threading
from utils.simple_auth import *



labelled_schema = [
    bigquery.SchemaField(
        "label", "STRING", mode="REQUIRED",
        description="RA-assigned label for pair"),
    bigquery.SchemaField(
        "labeler", "STRING", mode="REQUIRED",
        description="Which RA labeled this pair"),
    bigquery.SchemaField(
        "reason", "STRING", mode="NULLABLE",
        description="RA-specified reason for labeling pair as violative"),
    bigquery.SchemaField(
        "other_reason", "STRING", mode="NULLABLE",
        description="RA-specified other reason"),
    bigquery.SchemaField(
        "id_a", "STRING", mode="REQUIRED",
        description="YouTube video ID for regretted video"),
    bigquery.SchemaField(
        "id_b", "STRING", mode="REQUIRED",
        description="YouTube video ID for recommended video"),
    bigquery.SchemaField(
        "title_a", "STRING", mode="REQUIRED",
        description="Video title for regretted video"),
    bigquery.SchemaField(
        "title_b", "STRING", mode="REQUIRED",
        description="Video title for recommended video"),
    bigquery.SchemaField(
        "description_a", "STRING", mode="REQUIRED",
        description="Video description for regretted video"),
    bigquery.SchemaField(
        "description_b", "STRING", mode="REQUIRED",
        description="Video description for recommended video"),
    bigquery.SchemaField(
        "channel_a", "STRING", mode="REQUIRED",
        description="Video channel for regretted video"),
    bigquery.SchemaField(
        "channel_b", "STRING", mode="REQUIRED",
        description="Video channel for recommended video"),
    bigquery.SchemaField(
        "label_time", "DATETIME", mode="REQUIRED",
        description="Date & time at which the data is labelled"),
]

to_label_schema = [
    bigquery.SchemaField(
        "labeler", "STRING", mode="REQUIRED",
        description="Which RA should label this pair"),
    bigquery.SchemaField(
        "id_a", "STRING", mode="REQUIRED",
        description="YouTube video ID for regretted video"),
    bigquery.SchemaField(
        "id_b", "STRING", mode="REQUIRED",
        description="YouTube video ID for recommended video"),
    bigquery.SchemaField(
        "title_a", "STRING", mode="REQUIRED",
        description="Video title for regretted video"),
    bigquery.SchemaField(
        "title_b", "STRING", mode="REQUIRED",
        description="Video title for recommended video"),
    bigquery.SchemaField(
        "description_a", "STRING", mode="REQUIRED",
        description="Video description for regretted video"),
    bigquery.SchemaField(
        "description_b", "STRING", mode="REQUIRED",
        description="Video description for recommended video"),
    bigquery.SchemaField(
        "channel_a", "STRING", mode="REQUIRED",
        description="Video channel for regretted video"),
    bigquery.SchemaField(
        "channel_b", "STRING", mode="REQUIRED",
        description="Video channel for recommended video"),
]

corpus_table_id = "regrets-reporter-dev.ra_can_read.pairs_sample"
labelled_table_id = "regrets-reporter-dev.ra_can_write.labelled"
to_label_table_id = "regrets-reporter-dev.ra_can_read.to_label"

_table_created = {
    corpus_table_id: False,
    labelled_table_id: False,
    to_label_table_id: False,
}

@st.cache(hash_funcs={bigquery.client.Client: id})
def table_exists(bq_client, table):
    if _table_created[table]:
        return True
    try:
        bq_client.get_table(table)
        return True
    except (NotFound, Forbidden):
        return False
@st.cache
def get_table(table, schema):
    return bigquery.Table(table, schema=schema)

@st.cache(hash_funcs={bigquery.client.Client: id})
def connect_to_db(user):
    if user == 'admin':
        #credentials = pydata_google_auth.get_user_credentials(
        #    ['https://www.googleapis.com/auth/bigquery'],
        #    use_local_webserver=True,
        #)
        credentials = service_account.Credentials.from_service_account_info(
            dict(**st.secrets.ranu_testing), scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
        
    else:
        credentials = service_account.Credentials.from_service_account_info(
            dict(**st.secrets.bq_service_account), scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
    project_id = "regrets-reporter-dev"
    bq_client = bigquery.Client(
        project=project_id, credentials=credentials)
    return bq_client

def display_labelling_progress():
    try:
        df_labelled = st.session_state.bq_client.query(
            f"SELECT * FROM {labelled_table_id}").result().to_dataframe()
    except NotFound:
        df_labelled = None
    try:
        df_to_label = st.session_state.bq_client.query(
            f"SELECT * FROM {to_label_table_id}").result().to_dataframe()
    except NotFound:
        df_to_label = None
    st.subheader('Labelled So Far')
    if df_labelled is not None:
        df_labelled = df_labelled.groupby('labeler', as_index=False)[
            'label'].count()
        st.dataframe(df_labelled)
    else:
        st.text("No data labelled")
    st.subheader('To label')
    if df_to_label is not None:
        st.dataframe(df_to_label)
    else:
        st.text("No data to label")


def assign_sample_data_to_label_old(token='admin'):

    corpus_query = f'''
    SELECT
        regret_id AS id_a,
        recommendation_id AS id_b,
        regret_title AS title_a,
        recommendation_title AS title_b,
        regret_description AS description_a,
        recommendation_description AS description_b,
        regret_channel AS channel_a,
        recommendation_channel AS channel_b,

    FROM
        {corpus_table_id}
    LIMIT 100

    '''
    df_corpus = st.session_state.bq_client.query(corpus_query).result(
    ).to_dataframe()

    if table_exists(st.session_state.bq_client, labelled_table_id):
        df_labelled = st.session_state.bq_client.query(
            f"SELECT * FROM {labelled_table_id}").result().to_dataframe()
        df_to_label = df_corpus[~(df_corpus.id_a + df_corpus.id_b).isin(
            df_labelled.id_a + df_labelled.id_b)].reset_index(drop=True)
    else:
        df_to_label = df_corpus


    assign_method = st.sidebar.selectbox('Method',['Select','Random','Head','Active Learning'])
    if assign_method == 'Select':
        st.warning('Please select a method to assign data in the sidebar')
        st.stop()
    if st.checkbox('Display Corpus'):
        st.subheader('Corpus')
        st.warning(f'The corpus has {df_corpus.shape[0]} rows.')

    if assign_method == 'Active Learning':
        st.info('Active Learning pipeline is not ready yet. Please select other methods for now.')
        st.stop()

    nrows = st.number_input(
        'Select number of data points to labeling', min_value=5, value=5, step=5)
    if nrows == 0:
        st.error('Please select more than 0 rows')
        st.stop()
    df_to_label = df_to_label.head(nrows)

    labeler = st.selectbox('Choose the labeler', ['admin','jesse', 'chico', 'ranu'])
    df_to_label.loc[:, 'labeler'] = labeler
    if st.button('Add data for labeling'):
        table = bigquery.Table(to_label_table_id, schema=to_label_schema)
        if ~table_exists(to_label_table_id): 
            table = st.session_state.bq_client.create_table(table)
            _table_created[to_label_table_id] = True
        job_config = bigquery.LoadJobConfig(
            write_disposition="WRITE_APPEND",
            schema=to_label_schema,
        )

        load_job = st.session_state.bq_client.load_table_from_json(
            df_to_label.to_dict(orient='records'),
            table,
            job_config=job_config,
        )
        load_job.result()
        with hc.HyLoader(f'Adding {nrows} datapoints for labeling',hc.Loaders.standard_loaders,index=[2,2,2,2]):
            time.sleep(3)
        st.success(f'Added {nrows} datapoints for labeling')
        time.sleep(2)
        st.experimental_rerun()

    return df_to_label


def assign_sample_data_to_label(token='admin'):

    profile_dict = get_all_users()
    users_list = list(profile_dict.keys())
    users_list = [i for i in users_list if i not in ('admin')]
    if len(users_list) < 1:
        st.error('No users added other than the admin')
        st.stop()
    corpus_query = f'''
    SELECT
        regret_id AS id_a,
        recommendation_id AS id_b,
        regret_title AS title_a,
        recommendation_title AS title_b,
        regret_description AS description_a,
        recommendation_description AS description_b,
        regret_channel AS channel_a,
        recommendation_channel AS channel_b,

    FROM
        {corpus_table_id}
    LIMIT 100

    '''
    df_corpus = st.session_state.bq_client.query(corpus_query).result(
    ).to_dataframe()

    if table_exists(st.session_state.bq_client, labelled_table_id):
        df_labelled = st.session_state.bq_client.query(
            f"SELECT * FROM {labelled_table_id}").result().to_dataframe()
        df_to_label = df_corpus[~(df_corpus.id_a + df_corpus.id_b).isin(
            df_labelled.id_a + df_labelled.id_b)].reset_index(drop=True)
    else:
        df_to_label = df_corpus


    assign_method = st.sidebar.selectbox('Method',['Select','Random','Head','Active Learning'])
    if assign_method == 'Select':
        st.warning('Please select a method to assign data in the sidebar')
        st.stop()
    if st.checkbox('Display Corpus'):
        st.subheader('Corpus')
        st.warning(f'The corpus has {df_corpus.shape[0]} rows.')

    if assign_method == 'Active Learning':
        st.info('Active Learning pipeline is not ready yet. Please select other methods for now.')
        st.stop()

    nrows = st.number_input(
        'Select number of data points to labeling', min_value=5, value=5, step=5)
    if nrows < 1:
        st.error('Please select more than 0 rows')
        st.stop()
    else:
        nrows = int(nrows)
    if assign_method == 'Head':
        df_to_label = df_to_label.head(nrows)
    if assign_method == 'Random':
        df_to_label = df_to_label.sample(nrows, random_state=123).reset_index(drop=True)

    assign = np.array(users_list*int(df_to_label.shape[0]/len(users_list)))

    # labeler = st.selectbox('Choose the labeler', users_list)
    df_to_label.loc[:len(assign)-1, 'labeler'] = assign
    st.dataframe(df_to_label)
    if st.button('Add data for labeling'):
        table = bigquery.Table(to_label_table_id, schema=to_label_schema)
        if ~table_exists(to_label_table_id): 
            table = st.session_state.bq_client.create_table(table)
            _table_created[to_label_table_id] = True
        job_config = bigquery.LoadJobConfig(
            write_disposition="WRITE_APPEND",
            schema=to_label_schema,
        )

        load_job = st.session_state.bq_client.load_table_from_json(
            df_to_label.to_dict(orient='records'),
            table,
            job_config=job_config,
        )
        load_job.result()
        with hc.HyLoader(f'Adding {nrows} datapoints for labeling',hc.Loaders.standard_loaders,index=[2,2,2,2]):
            time.sleep(3)
        st.success(f'Added {nrows} datapoints for labeling')
        time.sleep(2)
        st.experimental_rerun()

    return df_to_label


_MIN_TO_LABEL_BUFF = 10
_TO_LABEL_REFRESH = 20

def _pull_thread(cv, data_to_label, bq_client):
    try:
        bq_client.get_table(to_label_table_id)
    except (NotFound, Forbidden):
        st.error("NO DATA AVAILABLE TO LABEL")
    fetch_job = None
    while True:
        cv.acquire()
        if (len(data_to_label[0]) > _MIN_TO_LABEL_BUFF) or (fetch_job is not None):
            cv.wait()
        elif fetch_job is None:
            cv.release()
            if table_exists(bq_client, labelled_table_id):
                fetch_job = bq_client.query(
                    f"SELECT * FROM {to_label_table_id} a LEFT JOIN {labelled_table_id} using(id_a, id_b) WHERE label IS NULL LIMIT {_TO_LABEL_REFRESH}")
            else:
                fetch_job =  bq_client.query(
                    f"SELECT * FROM {to_label_table_id} LIMIT {_TO_LABEL_REFRESH}")
            new_data = fetch_job.result().to_dataframe()
            fetch_job = None
            cv.acquire()
            data_to_label[0] = pd.concat([data_to_label[0], new_data])
            cv.notify()
            cv.release()


def get_datapoint_to_label(labeler):
    if "data_to_label" not in st.session_state:
        st.session_state['data_to_label'] = [pd.DataFrame()] # Note use of list as pseudo-pointer so data frame can be reassigned

    if "load_thread" not in st.session_state:
        c = threading.Condition()
        st.session_state['load_thread_cv'] = c
        th = threading.Thread(target=_pull_thread, args=[c, st.session_state.data_to_label, st.session_state.bq_client])
        th.start()
        st.session_state['load_thread'] = th
    st.session_state.load_thread_cv.acquire()
    if len(st.session_state.data_to_label[0]) == 0:
        st.session_state.load_thread_cv.wait()
    elif len(st.session_state.data_to_label[0]) <= _MIN_TO_LABEL_BUFF:
        st.session_state.load_thread_cv.notify()
    res = st.session_state.data_to_label[0].head(1)
    st.session_state.data_to_label[0].drop(0, inplace=True)
    st.session_state.data_to_label[0].reset_index(drop=True, inplace=True)
    st.session_state.load_thread_cv.release()
    if len(res) == 0:
        st.error("NO DATA AVAILABLE TO LABEL")
        return None
    print(f"ready to label {res.id_a.item()} and {res.id_b.item()} and buffer has {len(st.session_state.data_to_label[0])} items")
    return (res.title_a.item(), res.channel_a.item(), res.description_a.item(), res.id_a.item(), res.title_b.item(), res.channel_b.item(), res.description_b.item(), res.id_b.item())

def _push_thread(cv, data_to_push, bq_client, _table_created):
    table = get_table(labelled_table_id, labelled_schema)
    if not table_exists(bq_client, labelled_table_id):
        table = bq_client.create_table(table)
        _table_created[labelled_table_id] = True
    job_config = bigquery.LoadJobConfig(
            write_disposition="WRITE_APPEND",
            schema=labelled_schema,
        )
    while True:
        cv.acquire()
        if len(data_to_push) == 0:
            cv.wait()
        else:
            cur_data = data_to_push.copy()
            data_to_push.clear()
            cv.release()
            print(f"pushing {len(cur_data)}")
            load_job = bq_client.load_table_from_json(
                cur_data,
                table,
                job_config=job_config,
            )
            load_job.result()

def add_labelled_datapoint_to_db(res, decision_dict):
    title_a, channel_a, description_a, id_a, title_b, channel_b, description_b, id_b = res
    decision_dict['title_a'] = title_a
    decision_dict['channel_a'] = channel_a
    decision_dict['description_a'] = description_a
    decision_dict['id_a'] = id_a
    decision_dict['title_b'] = title_b
    decision_dict['channel_b'] = channel_b
    decision_dict['description_b'] = description_b
    decision_dict['id_b'] = id_b
    decision_dict['label_time'] = str(datetime.now())

    
    if "data_to_push" not in st.session_state:
        st.session_state['data_to_push'] = []

    if "push_thread" not in st.session_state:
        c = threading.Condition()
        st.session_state['push_thread_cv'] = c
        th = threading.Thread(target=_push_thread, args=[c, st.session_state.data_to_push, st.session_state.bq_client, _table_created])
        th.start()
        st.session_state['push_thread'] = th

    st.session_state.push_thread_cv.acquire()
    
    st.session_state.data_to_push.append(decision_dict)
    st.session_state.push_thread_cv.notify()
    st.session_state.push_thread_cv.release()

    
    return 'Done'


