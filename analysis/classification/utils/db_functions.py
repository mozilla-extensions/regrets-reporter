import streamlit as st
import pandas as pd
from utils.helpers import user_dir, repo_dir, data_dir
from st_aggrid import AgGrid
import hydralit_components as hc
from streamlit import caching
import time
from datetime import datetime
from google.cloud import bigquery
from google.oauth2 import service_account
from google.api_core.exceptions import Conflict, NotFound, Forbidden
import pydata_google_auth


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

bq_client = None


def connect_to_db(user):
    global bq_client
    if user == 'admin':
        credentials = pydata_google_auth.get_user_credentials(
            ['https://www.googleapis.com/auth/bigquery'],
            use_local_webserver=True,
        )

        project_id = "regrets-reporter-dev"
        bq_client = bigquery.Client(
            project=project_id, credentials=credentials)
    else:
        credentials = service_account.Credentials.from_service_account_info(
            dict(**st.secrets.bq_service_account), scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
        project_id = "regrets-reporter-dev"
        bq_client = bigquery.Client(
            project=project_id, credentials=credentials)


def display_labelling_progress():
    try:
        df_labelled = bq_client.query(
            f"SELECT * FROM {labelled_table_id}").result().to_dataframe()
    except NotFound:
        df_labelled = None
    try:
        df_to_label = bq_client.query(
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


def assign_sample_data_to_label(token='admin'):

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
    df_corpus = bq_client.query(corpus_query).result(
    ).to_dataframe()

    try:
        bq_client.get_table(labelled_table_id)
        df_labelled = bq_client.query(
            f"SELECT * FROM {labelled_table_id}").result().to_dataframe()
        
        # uids_to_ignore = []
        # if len(df_assigned) > 0:
        #     assigned_uids = df_assigned.uid.unique()
        #     uids_to_ignore.extend(assigned_uids)
        # if len(df_labelled) > 0:
        #     lablled_uids = df_labelled.uid.unique()
        #     uids_to_ignore.extend(lablled_uids)

        # df_corpus = df_corpus[~df_corpus.uid.isin(uids_to_ignore)].reset_index(drop=True)

        df_to_label = df_corpus[~(df_corpus.id_a + df_corpus.id_b).isin(
            df_labelled.id_a + df_labelled.id_b)].reset_index(drop=True)
    except NotFound:
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
        try:
            table = bq_client.create_table(table)
        except Conflict:
            pass
        job_config = bigquery.LoadJobConfig(
            write_disposition="WRITE_APPEND",
            schema=to_label_schema,
        )

        load_job = bq_client.load_table_from_json(
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


def get_datapoint_to_label(labeler):
    try:
        bq_client.get_table(to_label_table_id)
    except (NotFound, Forbidden):
        print("NO DATA TO LABEL")
        return None
    try:
        bq_client.get_table(labelled_table_id)
        res = bq_client.query(
            f"SELECT * FROM {to_label_table_id} a LEFT JOIN {labelled_table_id} using(id_a, id_b)  where a.labeler='{labeler}' AND label IS NULL LIMIT 1").result().to_dataframe()
    except (NotFound, Forbidden):
        res =  bq_client.query(
            f"SELECT * FROM {to_label_table_id}  where labeler='{labeler}'  LIMIT 1").result().to_dataframe()  # Should maybe check for empty result
    return (res.title_a.item(), res.channel_a.item(), res.description_a.item(), res.id_a.item(), res.title_b.item(), res.channel_b.item(),
    res.description_b.item(), res.id_b.item())

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
    table = bigquery.Table(labelled_table_id, schema=labelled_schema)
    try:
        table = bq_client.create_table(table)
    except Conflict:
        pass
    job_config = bigquery.LoadJobConfig(
        write_disposition="WRITE_APPEND",
        schema=labelled_schema,
    )

    load_job = bq_client.load_table_from_json(
        [decision_dict],
        table,
        job_config=job_config,
    )
    if "load_job" in st.session_state and st.session_state.load_job != None:
        st.session_state.load_job.results()
    st.session_state.load_job = load_job
    return 'Done'

"""

    decision_dict['datetime'] = str(datetime.now())
    token = decision_dict['token']

    df = pd.DataFrame(decision_dict,index=[0])

    df.to_sql('labelled',con=con, if_exists= 'append',index=False)
    delete_labelled_datapoint(uid,token)
    return 'Done'

"""