import streamlit as st
import pandas as pd
import sqlite3
import streamlit.components.v1 as components
import time
from streamlit_player import st_player
import hydralit_components as hc

import json
import numpy as np
import random
from youtube_transcript_api import YouTubeTranscriptApi
from utils.helpers import user_dir
from utils.db_functions import *

def display_video_transcripts():
    res = st.session_state['res']

    """An extension of the video widget
   Arguments:
       src {str} -- url of the video Eg:- https://www.youtube.com/embed/B2iAodr0fOo
   Keyword Arguments:
       width {str} -- video width(By default: {"100%"})
       height {int} -- video height (By default: {315})
   """
    title_a, channel_a, description_a, id_a,title_b,channel_b, description_b, id_b, method = res

    title1, title2, title3, title4, title5 = st.columns([8,1,1,1,8])
    src1,src2 = id_a, id_b
    video1, video2,video3,video4,video5 = st.columns([8,1,1,1,8])

    theme_bad = {'bgcolor': '#FFF0F0','title_color': 'red','content_color': 'red','icon_color': 'red', 'icon': 'fa fa-times-circle'}
    theme_neutral = {'bgcolor': '#f9f9f9','title_color': 'orange','content_color': 'orange','icon_color': 'orange', 'icon': 'fa fa-question-circle'}
    theme_good = {'bgcolor': '#EFF8F7','title_color': 'green','content_color': 'green','icon_color': 'green', 'icon': 'fa fa-check-circle'}


    title1.markdown("<h4 style='text-align: center; color: red;'>Video the user doesn't want recommendations similar to</h4>", unsafe_allow_html=True)
    with video1.container():
        height = 300
        width = 600
        #st_player(f'https://www.youtube.com/watch?v={src1}',height = 400)
        st.write(f'<iframe width="{width}" height="{height}" src="https://www.youtube.com/embed/{src1}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
        unsafe_allow_html=True)
        st.markdown(f"<h4 style='text-align: center; color: red;'>{title_a}</h4>", unsafe_allow_html=True)
        st.error(f'Channel Name: {channel_a}')
        components.html(f"<p style='text-align: justify; color: red;'>{description_a}</p>", height=height,width=width, scrolling=True)

    title5.markdown("<h4 style='text-align: center; color: skyblue;'>Video that was recommended to the user</h4>", unsafe_allow_html=True)
    with video5.container():
        # st_player(f'https://www.youtube.com/watch?v={src2}',height=400)
        #hc.info_card(title=title_b, content=f'Channel Name: {channel_b}', sentiment='good',bar_value=100)
        st.write(f'<iframe width="{width}" height="{height}" src="https://www.youtube.com/embed/{src2}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
        unsafe_allow_html=True)
        st.markdown(f"<h4 style='text-align: center; color: red;'>{title_b}</h4>", unsafe_allow_html=True)
        st.info(f'Channel Name: {channel_b}')
        components.html(f"<p style='text-align: justify; color: skyblue;'>{description_b}</p>", height=height,width=width, scrolling=True)

def clear_res_from_session_state():
    del st.session_state['res']

def label_the_datapoint():

    res = st.session_state['res']
    try:
        token = st.session_state['token']
    except:
        st.write()
    decision_dict = {}

    with st.form(key='columns_in_form', clear_on_submit=True):
        def submit_handler():
            if st.session_state.label == "Bad recommendation" and st.session_state.reason == 'Click Here':
                st.session_state.warning_spot = 'Please choose a reason'
                #label = "Bad recommendation"
            else:
                st.session_state.warning_spot = ''
                add_labelled_datapoint_to_db(res, {'labeler': token, 'label': st.session_state.label, 'reason': st.session_state.reason, 'other_reason': st.session_state.comment, 'disturbing': st.session_state.disturbing})
                clear_res_from_session_state()
                #st.stop()
        #The below two lines are for horizontal radio buttons
        st.write('<style>div.row-widget.stRadio > div{flex-direction:row;justify-content: left;} </style>', unsafe_allow_html=True)
        st.write('<style>div.st-bf{flex-direction:column;} div.st-ag{font-weight:normal;padding-left:10px; margin: 0 50px 0 5px;}</style>', unsafe_allow_html=True)
        label = st.radio("Choose your response",("Acceptable Recommendation","Unsure","Bad recommendation"), index = (2 if "warning_spot" in st.session_state and st.session_state.warning_spot == 'Please choose a reason' else 0), key="label")
        
        col1, col2, col3 = st.columns(3)

        reason = col1.selectbox("If you think it's a bad recommendation, choose why?",['Click Here','Similar subject','Similar opinion','Same controversy','Same persons','Same undesirable','Other'], format_func = str, key="reason")
        comments = col2.text_input('Optional comment as to why recommendation is bad.', key="comment")
        disturbing = st.checkbox('recommended video is disturbing, hateful, or misinformation', key="disturbing")
        if "warning_spot" in st.session_state and st.session_state['warning_spot'] != '':
            st.warning(st.session_state['warning_spot'])
        submit_button = st.form_submit_button(label="Submit", on_click=submit_handler)
        

        
    display_video_transcripts()




    # form1, form2, form3, form4, form5, form6, form7 = st.columns([8,1,8,1,8,1,8])
    # if form7.checkbox('video is disturbing, hateful, or misinformation',key='checkbox'):
    #     st.session_state['checkbox'] = 'True'
    #     st.write(st.session_state)

    # with form1.form(key='acceptable',clear_on_submit = True):
    #     label = 'Acceptable Recommendation'
    #     reason = None
    #     decision_dict['labeler'] = token
    #     decision_dict['label'] = label
    #     decision_dict['reason'] = reason
    #     decision_dict['other_reason'] = None
    #     submit_button = st.form_submit_button(label=label, on_click=clear_res_from_session_state)
    #     if submit_button:
    #         add_labelled_datapoint_to_db(res,decision_dict)


    # with form3.form(key='unsure',clear_on_submit = True):
    #     label = 'Unsure'
    #     reason = None
    #     decision_dict['labeler'] = token
    #     decision_dict['label'] = label
    #     decision_dict['reason'] = reason
    #     decision_dict['other_reason'] = None
    #     submit_button = st.form_submit_button(label=label, on_click=clear_res_from_session_state)
    #     if submit_button:
    #         add_labelled_datapoint_to_db(res,decision_dict)


    # with form5.form(key='bad',clear_on_submit = True):
    #     label = 'Bad recommendation'
    #     reason = st.selectbox('Why do you think this is a bad recommendation',['Select','Similar subject','Similar opinion','Same controversy','Same persons','Same undesirable'])
    #     if reason == 'Select':
    #         reason = ''
    #     comments = st.text_input('Please write down if your reason is not listed above')
    #     decision_dict['labeler'] = token
    #     decision_dict['label'] = label
    #     decision_dict['reason'] = reason
    #     decision_dict['other_reason'] = comments
    #     submit_button = st.form_submit_button(label=label, on_click=clear_res_from_session_state)
    #     if submit_button:
    #         add_labelled_datapoint_to_db(res,decision_dict)
