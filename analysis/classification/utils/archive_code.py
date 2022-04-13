import streamlit as st
import pandas as pd
import sqlite3
import streamlit.components.v1 as components
import time
from streamlit_player import st_player
#import streamlit_player
import numpy as np
import random
from youtube_transcript_api import YouTubeTranscriptApi


def display_video_transcripts(video_to_play):
    """An extension of the video widget
   Arguments:
       src {str} -- url of the video Eg:- https://www.youtube.com/embed/B2iAodr0fOo
   Keyword Arguments:
       width {str} -- video width(By default: {"100%"})
       height {int} -- video height (By default: {315})
   """
    title1, title2, title3, title4, title5 = st.columns([8,1,1,1,8])
    src1,src2 = video_to_play[0], video_to_play[1]
    video1, video2,video3,video4,video5 = st.columns([8,1,1,1,8])

    title1.markdown("<h4 style='text-align: center; color: red;'>Video the user doesn't want recommendations similar to</h4>", unsafe_allow_html=True)
    with video1.container():
        st_player(f'https://www.youtube.com/watch?v={src1}')
        try:
            transcript = YouTubeTranscriptApi.get_transcript(video_to_play[0],languages=['en-US','en','de','en-GB','pt','id'])

            full_text = ''

            for l in transcript:
                full_text += (f" {l['text']}")
            #with text1.container():
            st.error('Channel Name:')
            components.html(f"<p style='text-align: justify; color: red;'>{full_text}</p>", height=400,width=700, scrolling=True)

        except Exception as e:
            st.error(f'No Transcripts found {e}')

    title5.markdown("<h4 style='text-align: center; color: skyblue;'>Video that was recommended to the user</h4>", unsafe_allow_html=True)
    with video5.container():
        st_player(f'https://www.youtube.com/watch?v={src2}')
        try:
            transcript = YouTubeTranscriptApi.get_transcript(video_to_play[1],languages=['en-US','en','de','en-GB','pt','id'])

            full_text = '\n'

            for l in transcript:
                full_text += (f" {l['text']}")
            st.info('Channel Name:')
            components.html(f"<p style='text-align: justify; color: skyblue;'>{full_text}</p>", height=400,width=700, scrolling=True)
        except Exception as e:
            st.error(f'No Transcripts found {e}')







# -------------------------------- USEFUL ALTERNATIVES ------------------------------------------------

# st.markdown('''
#     <a href="javascript:document.getElementsByClassName('css-1ydp377 edgvbvh6')[1].click();">
#         <img src="https://assets.mofoprod.net/network/images/extension-icon.2e16d0ba.fill-760x760-c100.format-jpeg.jpg" alt="RegretsIcon" style="width:50px;height:50px;"/>
#     </a>
#     ''', unsafe_allow_html=True)
# st.markdown("<h4 style='text-align: center; color: yellow;'>Active Learning Frontend</h4>", unsafe_allow_html=True)



# video1.write(
#     f'<iframe width="{width}" height="{height}" src="https://www.youtube.com/embed/{video_to_play[0]}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
#     unsafe_allow_html=True,
# )

    # menu_data = [
    #     {'icon': "far fa-copy", 'label':"Left End"},
    #     {'icon': "fa-solid fa-radar",'label':"Dropdown1", 'submenu':[{'id':' subid11','icon': "fa fa-paperclip", 'label':"Sub-item 1"},{'id':'subid12','icon': "💀", 'label':"Sub-item 2"},{'id':'subid13','icon': "fa fa-database", 'label':"Sub-item 3"}]},

    #     {'icon': "fa-solid fa-radar",'label':"Dropdown2", 'submenu':[{'label':"Sub-item 1", 'icon': "fa fa-meh"},{'label':"Sub-item 2"},{'icon':'🙉','label':"Sub-item 3",}]},
    # ]

    # over_theme = {'txc_inactive': '#d8ebe2'}
    # menu_id = hc.nav_bar(
    #     menu_definition=menu_data,
    #     override_theme=over_theme,
    #     home_name='Home',
    #     login_name='Logout',
    #     hide_streamlit_markers=True, #will show the st hamburger as well as the navbar now!
    #     sticky_nav=False, #at the top or not
    #     sticky_mode='pinned', #jumpy or not-jumpy, but sticky or pinned
    # )

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

from utils.library import display_video_transcripts
from utils.simple_auth import *

st.set_page_config(page_title='Active Learning Frontend',layout='wide')
    
token = simple_auth()
if token == '':
    st.stop()

#st.subheader('Active Learning Frontend')

con = sqlite3.connect('data/data.sqlite')

cursor = con.cursor()

df = pd.read_sql_query('select * from to_label',con)


with st.sidebar.expander('Operations'):
    # We dont want the RAs to retrain the model. This decision has to be taken by the admin
    if token == 'admin':
        operations = ['Select','View DF','Labeling','Re-Training']
    else:
        operations = ['Select','View DF','Labeling']
    operation = st.sidebar.selectbox('Choose your operation',operations)

if operation == 'Select':
    st.error('Choose your operation to proceed')
    st.stop()


if operation == 'Labeling':
    
    videos_list = ['CmSKVW1v0xM','JdWQJq2OkJs', 'kuFNmH7lVTA', 'r9PeYPHdpNo', '9FqwhW0B3tY',
       'uynhvHZUOOo', 'PeYJTluQ5tM', 'fhtw7Dpntb4', 'tLaUM2XbyJc',
       '0Puv0Pss33M', 'vMZiEsRuQlw', 'RjsThobgq7Q', 'CidaOP7PA-o',
       'IsqSwMsI_mc', '0QxN3l5UIgc', 'JkaxUblCGz0', 'GfO-3Oir-qM',
       'um2Q9aUecy0', 'R2DU85qLfJQ', 'bHIhgxav9LY', 'iph500cPK28',
       'VQsoG45Y_00', 'yCsgoLc_fzI', 'jyQwgBAaBag']
    video_to_play = random.sample(videos_list,2)

    display_video_transcripts(video_to_play)


    form1, form2, form3, form4, form5 = st.columns([8,1,8,1,8])
    with form1.form(key='acceptable',clear_on_submit = True):
        decision_dict = {}
        label = 'Acceptable Recommendation'
        reason = st.radio('Choose your options',['Select','reason1','reason2','reason3'],key='acceptable_radio')
        decision_dict['label'] = label
        decision_dict['reason'] = reason
        submit_button = st.form_submit_button(label=label)
        if submit_button:
            with open('data/t.json','w') as f:
                json.dump(decision_dict, f)
        decision_dict = {}


    with form3.form(key='unsure',clear_on_submit = True):
        decision_dict = {}
        label = 'Unsure'
        radio = st.selectbox('Choose your options',['Select','reason1','reason2','reason3'])
        submit_button = st.form_submit_button(label=label)
        if submit_button:
            st.balloons()


    with form5.form(key='bad',clear_on_submit = True):
        radio = st.multiselect('Choose your options',['Select','reason1','reason2','reason3'])
        feedback = st.text_input('Please write down your comments')
            
        submit_button = st.form_submit_button(label='Bad recommendation')

    option_data = [
    {'icon': "bi bi-hand-thumbs-up", 'label':"Acceptable Recommendation"},
    {'icon':"fa fa-question-circle",'label':"Unsure"},
    {'icon': "bi bi-hand-thumbs-down", 'label':"Bad recommendation"},
    ]

    # override the theme, else it will use the Streamlit applied theme
    over_theme = {'txc_inactive': 'white','menu_background':'grey','txc_active':'yellow','option_active':'green'}
    font_fmt = {'font-class':'h2','font-size':'150%'}

    # display a horizontal version of the option bar
    op = hc.option_bar(option_definition=option_data,title='',key='PrimaryOption',override_theme=over_theme,font_styling=font_fmt,horizontal_orientation=True)
    if op:
        st.session_state['result'] = op
        time.sleep(2)
        st.session_state['result'] = ''
        
    st.write(st.session_state['result'])

if operation == 'Re-Training':
    components.html('', height=200, scrolling=True)
    if st.button('Re-Train the model'):
        with hc.HyLoader('Retraining the model',hc.Loaders.standard_loaders,index=[1,2,3,4,5,6]):
            time.sleep(5)
        # with st.spinner('Wait for it...'):
        #     time.sleep(5)
            st.success('Done!')
            st.balloons()


if operation == 'View DF':
    st.markdown("<h4 style='text-align: center; color: yellow;'>Active Learning Frontend</h4>", unsafe_allow_html=True)
    AgGrid(df)






# def make_hashes(password):
# 	return hashlib.sha256(str.encode(password)).hexdigest()

# def check_hashes(password,hashed_text):
# 	if make_hashes(password) == hashed_text:
# 		return hashed_text
# 	return False
# # DB Management
# import sqlite3 
# conn = sqlite3.connect('data/profiles.db')
# c = conn.cursor()
# # DB  Functions

# def create_usertable():
# 	c.execute('CREATE TABLE IF NOT EXISTS userstable(username TEXT,password TEXT)')


# def add_userdata(username,password):
# 	c.execute('INSERT INTO userstable(username,password) VALUES (?,?)',(username,password))
# 	conn.commit()

# def login_user(username,password):
# 	c.execute('SELECT * FROM userstable WHERE username =? AND password = ?',(username,password))
# 	data = c.fetchall()
# 	return data


# def view_all_users():
# 	c.execute('SELECT * FROM userstable')
# 	data = c.fetchall()
# 	return data

# def auth():
#     auth_choices = ['Select','Login','Signup']
#     ph1 = st.empty()
#     ph2 = st.empty()
#     ph3 = st.empty()
#     ph4 = st.empty()
#     ph5 = st.empty()

#     auth_choice = ph1.selectbox('Choose your options', auth_choices)
#     if auth_choice == 'Select':
#         st.stop()
#     if auth_choice == 'Login':
#         username = ph2.text_input("Username")
#         password = ph3.text_input("Password",type='password')
#         if ph4.button("Login"):
#             # if password == '12345':
#             create_usertable()
#             hashed_pswd = make_hashes(password)

#             result = login_user(username,check_hashes(password,hashed_pswd))
#             if result:
#                 ph5.success("Logged In as {}".format(username))
#                 time.sleep(3)
#                 return True
#             else:
#                 st.warning("Incorrect Username/Password")
#     if auth_choice == 'Signup':
#         new_user = ph2.text_input("Username")
#         new_password = ph3.text_input("Password",type='password')
#         if ph4.button("Signup"):
#             create_usertable()
#             add_userdata(new_user,make_hashes(new_password))
#             st.success("You have successfully created a valid Account")
#             st.info("Go to Login Menu to login") 

# ph1 = st.empty()
# ph2 = st.empty()
# ph3 = st.empty()
# ph4 = st.empty()
# ph5 = st.empty()