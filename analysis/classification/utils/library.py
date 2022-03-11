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

# # df = pd.read_csv(f'{user_dir}/repos/youtubeRegrets/data/backend.csv')
# df = pd.read_csv('/home/ranu/repos/youTubeRegrets/data/backend.csv')

# df = df.sample(1).reset_index(drop=True)

def display_video_transcripts(res):

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


def label_the_datapoint(res, token):
    form1, form2, form3, form4, form5 = st.columns([8,1,8,1,8])
    with form1.form(key='acceptable',clear_on_submit = True):
        decision_dict = {}
        label = 'Acceptable Recommendation'
        reason = None
        decision_dict['labeler'] = token
        decision_dict['label'] = label
        decision_dict['reason'] = reason
        decision_dict['other_reason'] = None
        submit_button = st.form_submit_button(label=label)
        if submit_button:
            add_labelled_datapoint_to_db(res,decision_dict)


    with form3.form(key='unsure',clear_on_submit = True):
        decision_dict = {}
        label = 'Unsure'
        reason = None
        decision_dict['labeler'] = token
        decision_dict['label'] = label
        decision_dict['reason'] = reason
        decision_dict['other_reason'] = None
        submit_button = st.form_submit_button(label=label)
        if submit_button:
            add_labelled_datapoint_to_db(res,decision_dict)


    with form5.form(key='bad',clear_on_submit = True):
        decision_dict = {}
        label = 'Bad recommendation'
        reason = st.selectbox('Why do you think this is a bad recommendation',['Select','Similar subject','Similar opinion','Same controversy','Same persons','Same undesirable'])
        if reason == 'Select':
            reason = ''
        comments = st.text_input('Please write down if your reason is not listed above')
        decision_dict['labeler'] = token
        decision_dict['label'] = label
        decision_dict['reason'] = reason
        decision_dict['other_reason'] = comments
        submit_button = st.form_submit_button(label=label)
        if submit_button:
            add_labelled_datapoint_to_db(res,decision_dict)

    # with st.form(key='bad',clear_on_submit = True):
    #     form1, form2, form3, form4, form5 = st.columns([8,1,8,1,8])
    #     option_data = [
    #     {'icon': "bi bi-hand-thumbs-up", 'label':"Acceptable Recommendation"},
    #     {'icon':"fa fa-question-circle",'label':"Unsure"},
    #     {'icon': "bi bi-hand-thumbs-down", 'label':"Bad recommendation"},
    #     ]

    #     # override the theme, else it will use the Streamlit applied theme
    #     over_theme = {'txc_inactive': 'white','menu_background':'grey','txc_active':'yellow','option_active':'grey'}
    #     font_fmt = {'font-class':'h2','font-size':'150%'}

    #     reason = form5.multiselect('Why do you think this is a Bad recommendation',['Select','graphic injury or violence','sexual content','unpleasant language'])
    #     comments = form5.text_input('Please write down your comments if your reason is not listed above')

    #     # display a horizontal version of the option bar
    #     op = hc.option_bar(option_definition=option_data,title='',key='PrimaryOption',override_theme=over_theme,font_styling=font_fmt,horizontal_orientation=True)
    #     decision_dict = {}
    #     decision_dict['token'] = token
    #     decision_dict['label'] = op
    #     decision_dict['reason'] = reason
    #     decision_dict['comments'] = comments
    #     return st.form_submit_button()
