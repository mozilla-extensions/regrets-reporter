#from pyinstrument import Profiler

#profiler = Profiler()
# profiler.start()

from utils.db_functions import *
from utils.helpers import user_dir
from utils.simple_auth import *
from utils.library import *
import pandas as pd
import sqlite3
from youtube_transcript_api import YouTubeTranscriptApi

import streamlit.components.v1 as components
from st_aggrid import AgGrid
from streamlit_player import st_player
import streamlit as st
import hydralit_components as hc
import extra_streamlit_components as stx

import time
import numpy as np
import random
import warnings
import sys
import json
import pickle as pk
sys.path.append('utils/library/')
warnings.filterwarnings('ignore')

app_type = sys.argv[-1]
st.set_page_config(page_title='Active Learning Frontend', layout='wide')
ph1 = st.empty()
if app_type == 'qa':
    st.markdown("<h4 style='text-align: center;'>Testing Frontend</h4>", unsafe_allow_html=True)

else:
    st.markdown("<h4 style='text-align: center;'>Active Learning Frontend</h4>", unsafe_allow_html=True)


def logout():
    st.warning('Logging out!')
    cookie_manager = stx.CookieManager()
    cookie_manager.delete('token_and_pwd_hash')
    del st.session_state['token']
    if 'logged_in' in st.session_state:
        del st.session_state['logged_in']
    return None

with open('.streamlit/profile_dict.pk', 'rb') as f:
    profile_dict = pk.load(f)

token, pwd, token_and_pwd_hash, user_langs = get_cookie_token()
# print(user_langs)
# time.sleep(1)
# user_langs = profile_dict[token]['iso_codes']
st.session_state['user_langs'] = user_langs
st.session_state['token'] = token


if token_and_pwd_hash is None:
    #token_ is a dummy variable, the actual token comes from the session state in the simeple auth function
    token_ = simple_auth()

    if 'token' not in st.session_state:
        st.stop()
    else:
        token = st.session_state['token']

    if 'logged_in' not in st.session_state:
        st.session_state['logged_in'] = 'no'
    if st.session_state['logged_in'] != 'yes':
        st.stop()
    if token == '':
        st.stop()
    else:
        ph1.empty()





st.session_state['bq_client'] = connect_to_db(token)

########################### DataBase Management ################################

# We dont want the RAs to retrain the model. This decision to retrain has to be taken by the admin
if token == 'admin':
    with st.sidebar.expander('Operations'):
        operations = ['Select', 'Users Management','Assign Data',
                      'Get Stats', 'Labeling', 'Re-Training']
        operation = st.sidebar.selectbox('Choose your operation', operations)
else:
    operation = 'Labeling'

    
if st.sidebar.button('Logout'):
    logout()


if operation == 'Select':
    st.error('Choose your operation to proceed')
    st.stop()


if operation == 'Users Management':
    # st.subheader('Add Users')
    # add_users()
    # st.write('')
    components.html(
        f"<p style='text-align: justify; color: skyblue;'> </p>", height=10, scrolling=True)
    st.subheader('Delete Users')
    delete_users()
#st.session_state.value = 1

if operation == 'Assign Data':
    
    
    with open('.streamlit/settings.json','r') as f:
        json_result = json.load(f)
        sampling_mode = json_result.get('sampling_mode')
        target_probability = json_result.get('target_probability')
    index = 0
    if sampling_mode == "Random":
        index = 1
    if sampling_mode == "Active Learning":
        index = 2
    with st.form("Assignment configuration"):
        sampling_mode = st.selectbox('Choose the mode of sampling',['Select','Random','Active Learning'], index = index )
        if sampling_mode == 'Active Learning':
            if not target_probability:
                target_probability = 0.5
            target_probability = st.slider('Choose target probability for active learning', min_value=0, max_value=100, value=int(target_probability*100))/100 # store as float but show as int percentage slider
        if sampling_mode == 'Random':
            target_probability = None # set to None when not using Active Learning
        submitted = st.form_submit_button("Submit")
        if submitted:
            with open('.streamlit/settings.json','w') as f:
                json.dump({'sampling_mode': sampling_mode, 'target_probability': target_probability}, f)
                st.success(f"Saved the settings sucessfully: {sampling_mode} {target_probability}")



if operation == 'Labeling':
    if "res" not in st.session_state:
        st.session_state['res'] = get_datapoint_to_label(token)
    # st.session_state['token'] = token
    label_the_datapoint()
    #display_video_transcripts()
    
    


if operation == 'Get Stats':
    if token == 'admin':
        display_labelling_progress(token=token)

