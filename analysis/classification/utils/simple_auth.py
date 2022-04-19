# Security
#passlib,hashlib,bcrypt,scrypt

import pandas as pd
import time
import hashlib
import os
import pickle as pk
import streamlit as st
import hydralit_components as hc
import pickle as pk
import json
from streamlit import caching
import extra_streamlit_components as stx
import datetime

language_dict = {"Abkhazian": "ab", "Afar": "aa", "Afrikaans": "af", "Albanian": "sq", "Amharic": "am", "Arabic": "ar", "Aragonese": "an", "Armenian": "hy", "Assamese": "as", "Aymara": "ay", "Azerbaijani": "az", "Bashkir": "ba", "Basque": "eu", "Bengali (Bangla)": "bn", "Bhutani": "dz", "Bihari": "bh", "Bislama": "bi", "Breton": "br", "Bulgarian": "bg", "Burmese": "my", "Byelorussian (Belarusian)": "be", "Cambodian": "km", "Catalan": "ca", "Cherokee": '', "Chewa": '', "Chinese": "zh", "Chinese (Simplified)": "zh-Hans", "Chinese (Traditional)": "zh-Hant", "Corsican": "co", "Croatian": "hr", "Czech": "cs", "Danish": "da", "Divehi": '', "Dutch": "nl", "Edo": '', "English": "en", "Esperanto": "eo", "Estonian": "et", "Faeroese": "fo", "Farsi": "fa", "Fiji": "fj", "Finnish": "fi", "Flemish": '', "French": "fr", "Frisian": "fy", "Fulfulde": '', "Galician": "gl", "Gaelic (Scottish)": "gd", "Gaelic (Manx)": "gv", "Georgian": "ka", "German": "de", "Greek": "el", "Greenlandic": "kl", "Guarani": "gn", "Gujarati": "gu", "Haitian Creole": "ht", "Hausa": "ha", "Hawaiian": '', "Hebrew": "he, iw", "Hindi": "hi", "Hungarian": "hu", "Ibibio": '', "Icelandic": "is", "Ido": "io", "Igbo": '', "Indonesian": "id, in", "Interlingua": "ia", "Interlingue": "ie", "Inuktitut": "iu", "Inupiak": "ik", "Irish": "ga", "Italian": "it", "Japanese": "ja", "Javanese": "jv", "Kannada": "kn", "Kanuri": '', "Kashmiri": "ks", "Kazakh": "kk", "Kinyarwanda (Ruanda)": "rw", "Kirghiz": "ky", "Kirundi (Rundi)": "rn", "Konkani": '', "Korean": "ko", "Kurdish": "ku", "Laothian": "lo", "Latin": "la", "Latvian (Lettish)": "lv", "Limburgish ( Limburger)": "li", "Lingala": "ln", "Lithuanian": "lt", "Macedonian": "mk", "Malagasy": "mg", "Malay": "ms", "Malayalam": "ml", "Maltese": "mt", "Maori": "mi", "Marathi": "mr", "Moldavian": "mo", "Mongolian": "mn", "Nauru": "na", "Nepali": "ne", "Norwegian": "no", "Occitan": "oc", "Oriya": "or", "Oromo (Afaan Oromo)": "om", "Papiamentu": '', "Pashto (Pushto)": "ps", "Polish": "pl", "Portuguese": "pt", "Punjabi": "pa", "Quechua": "qu", "Rhaeto-Romance": "rm", "Romanian": "ro", "Russian": "ru", "Sami (Lappish)": '', "Samoan": "sm", "Sangro": "sg", "Sanskrit": "sa", "Serbian": "sr", "Serbo-Croatian": "sh", "Sesotho": "st", "Setswana": "tn", "Shona": "sn", "Sichuan Yi": "ii", "Sindhi": "sd", "Sinhalese": "si", "Siswati": "ss", "Slovak": "sk", "Slovenian": "sl", "Somali": "so", "Spanish": "es", "Sundanese": "su", "Swahili (Kiswahili)": "sw", "Swedish": "sv", "Syriac": '', "Tagalog": "tl", "Tajik": "tg", "Tamazight": '', "Tamil": "ta", "Tatar": "tt", "Telugu": "te", "Thai": "th", "Tibetan": "bo", "Tigrinya": "ti", "Tonga": "to", "Tsonga": "ts", "Turkish": "tr", "Turkmen": "tk", "Twi": "tw", "Uighur": "ug", "Ukrainian": "uk", "Urdu": "ur", "Uzbek": "uz", "Venda": '', "Vietnamese": "vi", "Volap\u00fck": "vo", "Wallon": "wa", "Welsh": "cy", "Wolof": "wo", "Xhosa": "xh", "Yi": '', "Yiddish": "yi, ji", "Yoruba": "yo", "Zulu": "zu"}

def create_auth_file():
    profile_dict = {'admin': None, 'ranu': None,'jesse':None}
    with open('.streamlit/profile_dict.pk', 'wb') as f:
        pk.dump(profile_dict, f)
    print("Created profile dict")
    return None

try:
    with open('.streamlit/profile_dict.pk', 'rb') as f:
        profile_dict = pk.load(f)
except:
    create_auth_file()
    with open('.streamlit/profile_dict.pk', 'rb') as f:
        profile_dict = pk.load(f)

def get_key(salt, pwd):
    return hashlib.pbkdf2_hmac('sha256', pwd.encode('utf-8'), salt, 100000)


def set_key(token, pwd):
    salt = os.urandom(32) # A new salt for this user
    key = get_key(salt, pwd)
    profile_dict[token] = {salt: key}
    return profile_dict

def add_user(user):
    profile_dict[user] = None
    with open('.streamlit/profile_dict.pk', 'wb') as f:
        pk.dump(profile_dict, f)
    
    return None

def get_all_users():
    with open('.streamlit/profile_dict.pk', 'rb') as f:
        profile_dict = pk.load(f)
        #st.write(profile_dict.keys())
    return profile_dict

def delete_users():
    with open('.streamlit/profile_dict.pk', 'rb') as f:
        profile_dict = pk.load(f) 
    users_list = list(profile_dict.keys())
    users_to_delete = st.multiselect('Select the Users',users_list)
    if st.button('Delete Users'):
        for user in users_to_delete:
            del profile_dict[user]
        st.success(f'Sucessfully Deleted {len(users_to_delete)} users from the DB')
        with open('.streamlit/profile_dict.pk', 'wb') as f:
            pk.dump(profile_dict, f)
        time.sleep(2)

        st.experimental_rerun()

def add_users():
    new_usernames = st.text_area("Usernames",key='new_user')
    if st.button("Add users"):
        users_list = new_usernames.splitlines()
        for user in users_list:
            add_user(user)
        st.success(f'Sucessfully added {len(users_list)} users to the DB')
        time.sleep(2)
        st.experimental_rerun()
    return 'ok'

def login():
    temp_header = st.empty()
    with st.sidebar.form(key='login'):
        token = st.text_input('username',key='token').lower()
        pwd = st.text_input("password", type='password', key='pwd')

        def validate_login():
            token = st.session_state['token']
            pwd = st.session_state['pwd']
            
            # check if the user is already exists or not
            try:
                salt_key = profile_dict[token]
            except:
                salt_key = None
            
            if salt_key is None:
                st.error("You have not setup an account yet, please refresh this page and signup first and comeback")
                st.stop()
            
            # check the hashed password entered with the hashed one we stored in our DV 
            else:
                salt = list(salt_key.keys())[0]
                orig_key = list(salt_key.values())[0]
                entered_key = get_key(salt, pwd)
                if entered_key  == orig_key:
                    st.session_state['logged_in'] = 'yes'                    
                    st.session_state['token'] = token
                    save_token_in_cookies(token, pwd)
                    try:
                        st.session_state['user_langs'] = profile_dict[token]['iso_codes']
                    except:
                        st.session_state['user_langs'] = ['en']
                else:
                    warning_placeholder = st.empty()
                    st.warning('Please enter the correct username/password')
                    time.sleep(3)
                    warning_placeholder.empty()
        
        if st.form_submit_button('Login', on_click=validate_login):
            # st.session_state['logged_in'] = 'yes'


                
            return token

def signup():
    all_users = get_all_users()
    with st.form(key='signup',clear_on_submit=True):
        token = st.text_input('Please choose a username',value='',key='token')
        pwd = st.text_input("Set up a Password", type='password',key='pwd')
        pwd_repeat = st.text_input('Please repeat the password', type='password', key='pwd_repeat')
        languages_comfortable = st.multiselect('Please Select the language(s) you are comfortable in', language_dict.keys(),help = 'Start typing the language to narrow down the options below',default = 'English',key='languages')
        error_message_ph = st.empty()
        def validate_signup():
            token = st.session_state['token']
            pwd = st.session_state['pwd']
            pwd_repeat = st.session_state['pwd_repeat']
            languages_comfortable = st.session_state['languages']
            error_message = ''
            
            if pwd != pwd_repeat:
                error_message = 'Passwords do not match'
            if token in all_users.keys():
                error_message = "User already exists, please try some other username"
            if token == 'admin':
                error_message = "Haha...You can't signup as an admin."
            if len(pwd) < 3:
                error_message = "Please choose a password with more than two characters"
            if len(token) < 3:
                error_message = "Please choose a username with more than three characters"

            error_message_ph.warning(error_message)
            st.session_state['error_message'] = error_message


        if st.form_submit_button('Signup', on_click = validate_signup):
            languages_iso_codes = [language_dict[i] for i in languages_comfortable]
            user_dict = set_key(token,pwd)
            user_dict[token]['languages'] = languages_comfortable
            user_dict[token]['iso_codes'] = languages_iso_codes
            profile_dict.update(user_dict)
            error_message = st.session_state['error_message']
            # st.write(profile_dict)
            if error_message != '':
                st.warning(error_message)
            else:
                # st.write(profile_dict)
                with open('.streamlit/profile_dict.pk', 'wb') as f:
                    pk.dump(profile_dict, f)

                with hc.HyLoader('Setting Up your account',hc.Loaders.standard_loaders,index=[1,0,5]):
                    time.sleep(5)
                    st.success("I've set the account for you, please login!!")



def signup_old(session_state=st.session_state):
    all_users = get_all_users()

    text1 = st.empty()
    text2 = st.empty()
    text3 = st.empty()
    text4 = st.empty()
    text5 = st.empty()
    text6 = st.empty()
    text7 = st.empty()
    text8 = st.empty()

    token = text1.text_input('Please choose a username',value='')
    if token == 'admin': 
        text2.error("Haha.....You can't signup as admin")
        st.stop()
    if token in all_users.keys():
        # st.write(f'token is {token}')
        text2.error('User already exists. Please login if you are the user, or choose another username')
        st.stop()
    if len(token) < 3:
        text2.error('Please setup a username with atleast 3 characters')
        st.stop()
    pwd = text3.text_input("Set up a Password", type='password')
    if pwd == '':
        st.stop()
    pwd_repeat = text4.text_input("Repeat the Password", type='password')
    if pwd_repeat == '':
        st.stop()
    if pwd != pwd_repeat:
        text5.error('Passwords do not match. Please contact the admin to reset it')
        st.stop()
    languages_comfortable = text6.multiselect('Please Select the language(s) you are comfortable in', language_dict.keys(),help = 'Start typing the language to narrow down the options below',default = 'English')
    if len(languages_comfortable) < 1:
        text7.error('Please select atleast one language')
        st.stop()
    languages_iso_codes = [language_dict[i] for i in languages_comfortable]
    profile_dict = set_key(token,pwd)
    profile_dict[token]['languages'] = languages_comfortable
    profile_dict[token]['iso_codes'] = languages_iso_codes
    if text8.button('Submit'):
        with open('.streamlit/profile_dict.pk', 'wb') as f:
            pk.dump(profile_dict, f)
            text1.empty()
            text2.empty()
            text3.empty()
            text4.empty()
            text5.empty()
            text6.empty()
            text7.empty()
            text8.empty()
        with hc.HyLoader('Setting Up your account',hc.Loaders.standard_loaders,index=[1,0,5]):
            time.sleep(5)
        st.success("I've set the account for you, please login!!")
        
@st.cache(allow_output_mutation=True)
def get_manager():
    return stx.CookieManager()


def save_token_in_cookies(token, pwd):
    cookie_manager = get_manager()
    days_from = datetime.datetime.now() + datetime.timedelta(3)
    cookie_manager.set('token_and_pwd_hash', hash(token + pwd), expires_at=days_from,key='token_hash')
    cookie_manager.set('token', token, expires_at=days_from,key='token_key')
    cookie_manager.set('pwd',pwd, expires_at=days_from,key='pwd')

def get_cookie_token():
    token = None
    cookie_manager = get_manager()
    cookies = cookie_manager.get_all(key='cookies')
    token = None if cookies is None else cookies.get('token', None)
    pwd = None if cookies is None else cookies.get('pwd', None)
    token_and_pwd_hash = None if cookies is None else cookies.get('token_and_pwd_hash', None)


    return token, pwd, token_and_pwd_hash


def simple_auth():
    with st.sidebar.expander('User Management'):
        temp_header = st.empty()
        if 'current_project' in st.session_state:
            operation_idx = st.session_state.get('operation', 0)
            st.session_state['operation'] = temp_header.selectbox('Choose your operation',['Select','Login','Signup'],index=operation_idx)
        else:
            st.session_state['operation'] = temp_header.selectbox('Choose your operation',['Select','Login','Signup'],index=0)


    if st.session_state['operation'] == 'Select':
        st.stop()
    elif st.session_state['operation'] == 'Login':
        all_users = get_all_users()
        token = login()
        temp_header.empty()

        return token
    elif st.session_state['operation'] == 'Signup':
        result = signup()
        
        return ''

