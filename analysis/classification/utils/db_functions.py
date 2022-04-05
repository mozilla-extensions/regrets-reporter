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
import sys

app_type = sys.argv[-1]
print(app_type)
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
        "regret_id", "STRING", mode="REQUIRED",
        description="YouTube video ID for regretted video"),
    bigquery.SchemaField(
        "recommendation_id", "STRING", mode="REQUIRED",
        description="YouTube video ID for recommended video"),
    bigquery.SchemaField(
        "regret_title", "STRING", mode="REQUIRED",
        description="Video title for regretted video"),
    bigquery.SchemaField(
        "recommendation_title", "STRING", mode="REQUIRED",
        description="Video title for recommended video"),
    bigquery.SchemaField(
        "regret_description", "STRING", mode="REQUIRED",
        description="Video description for regretted video"),
    bigquery.SchemaField(
        "recommendation_description", "STRING", mode="REQUIRED",
        description="Video description for recommended video"),
    bigquery.SchemaField(
        "regret_channel", "STRING", mode="REQUIRED",
        description="Video channel for regretted video"),
    bigquery.SchemaField(
        "recommendation_channel", "STRING", mode="REQUIRED",
        description="Video channel for recommended video"),
    bigquery.SchemaField(
        "label_time", "DATETIME", mode="REQUIRED",
        description="Date & time at which the data is labelled"),
    bigquery.SchemaField(
        "selection_method", "STRING", mode="REQUIRED",
        description="How this pair was selected and by which model"),
    bigquery.SchemaField(
        "disturbing", "STRING", mode="REQUIRED",
        description="Whether the video is disturbing, hateful, or misinformation"
    )
]


corpus_table_id = "regrets-reporter-dev.ra_can_read.pairs_to_label"
if app_type == 'qa':
    labelled_table_id = "regrets-reporter-dev.ra_can_write.labelled_qa"
else:
    labelled_table_id = "regrets-reporter-dev.ra_can_write.labelled_ra"


language_table_id = "regrets-reporter-dev.ra_can_read.langs"
model_table_id = "regrets-reporter-dev.ra_can_read.model_predictions_v1"

_table_created = {
    corpus_table_id: False,
    labelled_table_id: False,
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
        # TODO: BEFORE PROD DEPLOYMENT SWITCH BACK TO USER AUTHENTICATION FOR ADMIN
        # credentials = pydata_google_auth.get_user_credentials(
        #    ['https://www.googleapis.com/auth/bigquery'],
        #    use_local_webserver=True,
        # )
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


def display_labelling_progress(token='admin'):
    if token == 'admin':
        try:
            df_labelled = st.session_state.bq_client.query(
                f"SELECT labeler, COUNT(*) AS n FROM {labelled_table_id} GROUP BY labeler").result().to_dataframe()
        except NotFound:
            df_labelled = None
        try:
            corpus_count = st.session_state.bq_client.query(
                f"SELECT COUNT(*) AS n FROM {corpus_table_id}").result().to_dataframe()
        except NotFound:
            corpus_count = None
    else:
        try:
            df_labelled = st.session_state.bq_client.query(
                f"SELECT labeler, COUNT(*) AS n FROM {labelled_table_id}  where labeler= 'ranu' GROUP BY labeler").result().to_dataframe()
        except NotFound:
            df_labelled = None
        try:
            corpus_count = st.session_state.bq_client.query(
                f"SELECT COUNT(*) AS n FROM {corpus_table_id}").result().to_dataframe()
        except NotFound:
            corpus_count = None
    st.subheader('Labelled So Far')
    if df_labelled is not None:
        st.dataframe(df_labelled)
        st.text(f"{df_labelled.n.sum()} total labelled")
    else:
        st.text("No data labelled")
    st.subheader('To label')
    if corpus_count is not None:
        st.text(f"{corpus_count.n.item()} items in corpus")
    else:
        st.text("No data to label")
    
    if st.button('Refresh Stats'):
        st.experimental_rerun()


_MIN_TO_LABEL_BUFF = 10
_TO_LABEL_REFRESH = 20


def _pull_thread(cv, data_to_label, bq_client, user_langs, method):
    try:
        bq_client.get_table(corpus_table_id)
    except (NotFound, Forbidden):
        st.error("NO DATA AVAILABLE TO LABEL")
    fetch_job = None
    while True:
        cv.acquire()
        if (len(data_to_label[0]) > _MIN_TO_LABEL_BUFF) or (fetch_job is not None):
            cv.wait()
        elif fetch_job is None:
            cv.release()
            if method[0] == "Random":
                print("choosing random")
                if table_exists(bq_client, labelled_table_id):
                    fetch_job = bq_client.query(
                        f'''
                            SELECT
                                *
                            FROM
                                {corpus_table_id} a
                            LEFT JOIN
                                {labelled_table_id}
                            USING(regret_id, recommendation_id)
                            LEFT JOIN
                                {language_table_id} reg_l_t
                            ON regret_id = reg_l_t.video_id
                            LEFT JOIN
                                {language_table_id} rec_l_t
                            ON recommendation_id = rec_l_t.video_id
                            WHERE
                                label IS NULL
                                AND reg_l_t.description_lang IN ({",".join(["'" + i + "'" for i in user_langs + ["??"]])})
                                AND rec_l_t.description_lang IN ({",".join(["'" + i + "'" for i in user_langs + ["??"]])})
                            ORDER BY RAND()
                            LIMIT {_TO_LABEL_REFRESH}
                        '''
                    )
                else:
                    fetch_job = bq_client.query(
                        f'''
                            SELECT
                                *
                            FROM
                                {corpus_table_id}
                            LEFT JOIN
                                {language_table_id} reg_l_t
                            ON regret_id = reg_l_t.video_id
                            LEFT JOIN
                                {language_table_id} rec_l_t
                            ON recommendation_id = rec_l_t.video_id
                            WHERE
                                reg_l_t.description_lang IN ({",".join(["'" + i + "'" for i in user_langs + ["??"]])})
                                AND rec_l_t.description_lang IN ({",".join(["'" + i + "'" for i in user_langs + ["??"]])})
                            ORDER BY RAND()
                            LIMIT {_TO_LABEL_REFRESH}
                        '''
                    )
            
            else: # active learning case
                print("choosing with active learning")
                if table_exists(bq_client, labelled_table_id):
                    fetch_job = bq_client.query(
                        f'''
                            SELECT 
                                *
                            FROM (
                                SELECT
                                    *
                                FROM
                                    {corpus_table_id} a
                                LEFT JOIN
                                    {labelled_table_id}
                                USING(regret_id, recommendation_id)
                                LEFT JOIN
                                    {language_table_id} reg_l_t
                                ON regret_id = reg_l_t.video_id
                                LEFT JOIN
                                    {language_table_id} rec_l_t
                                ON recommendation_id = rec_l_t.video_id
                                INNER JOIN
                                    {model_table_id} m_t
                                USING(regret_id, recommendation_id)
                                WHERE
                                    model_timestamp = (SELECT MAX(model_timestamp) FROM {model_table_id})
                                    AND label IS NULL
                                    AND reg_l_t.description_lang IN ({",".join(["'" + i + "'" for i in user_langs + ["??"]])})
                                    AND rec_l_t.description_lang IN ({",".join(["'" + i + "'" for i in user_langs + ["??"]])})
                                ORDER BY ABS(2 * prediction - 1) ASC
                                LIMIT {_TO_LABEL_REFRESH * 20}
                            )
                            ORDER BY RAND()
                            LIMIT {_TO_LABEL_REFRESH}
                        '''
                    )
                else:
                    fetch_job = bq_client.query(
                        f'''
                            SELECT 
                                *
                            FROM (
                                SELECT
                                    *
                                FROM
                                    {corpus_table_id}
                                LEFT JOIN
                                    {language_table_id} reg_l_t
                                ON regret_id = reg_l_t.video_id
                                LEFT JOIN
                                    {language_table_id} rec_l_t
                                ON recommendation_id = rec_l_t.video_id
                                 INNER JOIN
                                    {model_table_id} m_t
                                USING(regret_id, recommendation_id)
                                WHERE
                                    model_timestamp = (SELECT MAX(model_timestamp) FROM {model_table_id})
                                    AND reg_l_t.description_lang IN ({",".join(["'" + i + "'" for i in user_langs + ["??"]])})
                                    AND rec_l_t.description_lang IN ({",".join(["'" + i + "'" for i in user_langs + ["??"]])})
                                ORDER BY ABS(2 * prediction - 1) ASC
                                 LIMIT {_TO_LABEL_REFRESH * 20}
                            )
                            ORDER BY RAND()
                            LIMIT {_TO_LABEL_REFRESH}
                        '''
                    )
            new_data = fetch_job.result().to_dataframe()
            fetch_job = None
            cv.acquire()
            data_to_label[0] = pd.concat([data_to_label[0], new_data])
            cv.notify()
            cv.release()


def get_datapoint_to_label(labeler):
    if "method" not in st.session_state:
        st.session_state['method'] = ["Random"]
    with open('.streamlit/settings.json','r') as f:
            json_result = json.load(f)
            st.session_state.method[0] = json_result['sampling_mode']
            print(st.session_state.method[0])
    if "data_to_label" not in st.session_state:
        # Note use of list as pseudo-pointer so data frame can be reassigned
        st.session_state['data_to_label'] = [pd.DataFrame()]

    if "load_thread" not in st.session_state:
        c = threading.Condition()
        st.session_state['load_thread_cv'] = c
        th = threading.Thread(target=_pull_thread, args=[
                              c, st.session_state.data_to_label, st.session_state.bq_client, st.session_state.user_langs, st.session_state.method])
        th.start()
        st.session_state['load_thread'] = th
    st.session_state.load_thread_cv.acquire()
    if len(st.session_state.data_to_label[0]) == 0:
        st.session_state.load_thread_cv.wait()  
    elif len(st.session_state.data_to_label[0]) <= _MIN_TO_LABEL_BUFF:
        st.session_state.load_thread_cv.notify()

    if 'res' not in st.session_state:
        res = st.session_state.data_to_label[0].head(1)
        st.session_state.data_to_label[0].drop(0, inplace=True)
        st.session_state.data_to_label[0].reset_index(drop=True, inplace=True)
        st.session_state.load_thread_cv.release()
        if len(res) == 0:
            st.error("NO DATA AVAILABLE TO LABEL")
            return None
        print(
            f"ready to label {res.regret_id.item()} and {res.recommendation_id.item()} and buffer has {len(st.session_state.data_to_label[0])} items")
        if st.session_state.method[0] != "Random":
            print(f"p prob is {res.prediction.item()}")
        return (res.regret_title.item(), res.regret_channel.item(), res.regret_description.item(),
                res.regret_id.item(), res.recommendation_title.item(), res.recommendation_channel.item(), res.recommendation_description.item(), res.recommendation_id.item(), st.session_state.method[0])

    else:
        res = st.session_state['res']
        return res


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
            print(f"pushing {len(cur_data)} to {labelled_table_id}")
            load_job = bq_client.load_table_from_json(
                cur_data,
                table,
                job_config=job_config,
            )
            load_job.result()

def add_labelled_datapoint_to_db(res, decision_dict):
    regret_title, regret_channel, regret_description, regret_id, recommendation_title, recommendation_channel, recommendation_description, recommendation_id, method = res
    decision_dict['regret_title'] = regret_title
    decision_dict['regret_channel'] = regret_channel
    decision_dict['regret_description'] = regret_description
    decision_dict['regret_id'] = regret_id
    decision_dict['recommendation_title'] = recommendation_title
    decision_dict['recommendation_channel'] = recommendation_channel
    decision_dict['recommendation_description'] = recommendation_description
    decision_dict['recommendation_id'] = recommendation_id
    decision_dict['label_time'] = str(datetime.now())
    decision_dict['selection_method'] = method

    if "data_to_push" not in st.session_state:
        st.session_state['data_to_push'] = []

    if "push_thread" not in st.session_state:
        c = threading.Condition()
        st.session_state['push_thread_cv'] = c
        th = threading.Thread(target=_push_thread, args=[
                              c, st.session_state.data_to_push, st.session_state.bq_client, _table_created])
        th.start()
        st.session_state['push_thread'] = th

    st.session_state.push_thread_cv.acquire()

    st.session_state.data_to_push.append(decision_dict)
    st.session_state.push_thread_cv.notify()
    st.session_state.push_thread_cv.release()

    return 'Done'
