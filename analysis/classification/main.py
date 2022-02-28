import pandas as pd
import sqlite3
from youtube_transcript_api import YouTubeTranscriptApi

import streamlit.components.v1 as components
from st_aggrid import AgGrid
from streamlit_player import st_player
import streamlit as st
import hydralit_components as hc

import time
import numpy as np
import random
import warnings
import sys
import json
sys.path.append('utils/library/')
warnings.filterwarnings('ignore')

from utils.library import *
from utils.simple_auth import *
from utils.helpers import user_dir
from utils.db_functions import *

st.set_page_config(page_title='Active Learning Frontend',layout='wide')
    
token = simple_auth()
if token == '':
    st.stop()
connect_to_db(token)
#token = 'admin'
########################### DataBase Management ################################


with st.sidebar.expander('Operations'):
    # We dont want the RAs to retrain the model. This decision to retrain has to be taken by the admin
    if token == 'admin':
        operations = ['Select','Get Stats','Assign data','Labeling','Re-Training']
    else:
        operations = ['Select','Labeling']
    operation = st.sidebar.selectbox('Choose your operation',operations)

if operation == 'Select':
    st.error('Choose your operation to proceed')
    st.stop()


#st.session_state.value = 1


if operation == 'Labeling':
    res = get_datapoint_to_label(token)
    if res != None:
        label_the_datapoint(res,token)
        display_video_transcripts(res)
    else:
        st.success('No more data left for labelling. Thank you!!!')
        st.balloons()

        
if operation == 'Assign data':
    if token == 'admin':
        assign_sample_data_to_label()
    else:
        st.write('Hmm')

if operation == 'Get Stats':
    if token == 'admin':
        display_labelling_progress()

