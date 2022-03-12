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

import time
import numpy as np
import random
import warnings
import sys
import json
sys.path.append('utils/library/')
warnings.filterwarnings('ignore')


st.set_page_config(page_title='Active Learning Frontend', layout='wide')

token = simple_auth()
if token == '':
    st.stop()
st.session_state['bq_client'] = connect_to_db(token)
#token = 'admin'
########################### DataBase Management ################################

# We dont want the RAs to retrain the model. This decision to retrain has to be taken by the admin
if token == 'admin':
    with st.sidebar.expander('Operations'):
        operations = ['Select', 'Users Management',
                      'Get Stats', 'Labeling', 'Re-Training']
        operation = st.sidebar.selectbox('Choose your operation', operations)
else:
    operation = 'Labeling'


if operation == 'Select':
    st.error('Choose your operation to proceed')
    st.stop()


if operation == 'Users Management':
    st.subheader('Add Users')
    add_users()
    st.write('')
    components.html(
        f"<p style='text-align: justify; color: skyblue;'> </p>", height=10, scrolling=True)
    st.subheader('Delete Users')
    delete_users()
#st.session_state.value = 1


if operation == 'Labeling':
    res = get_datapoint_to_label(token)
    if res != None:
        label_the_datapoint(res, token)
        display_video_transcripts(res)
    else:
        st.success('No more data left for labelling. Thank you!!!')
        st.balloons()


if operation == 'Get Stats':
    if token == 'admin':
        display_labelling_progress()

# profiler.stop()

# profiler.print()
    