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
        time.sleep(4)

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
    with st.sidebar.expander("Authorization"):
        token = st.text_input('username').lower()
        if token == '':
            temp_header.error("Please sign in using the auth area to your left")
            st.stop()
        else:
            # If there is no user, it'll return None
            if token not in profile_dict:
                st.error("Sorry, you do not have access to the system.  Please write to the admin for access.")
                st.stop()
            # If the user is in the system.
            else:
                salt_key = profile_dict[token]
                # They profile will not have the salt and key if the user has not set a password
                # Ask user to set password        
                if salt_key is None:
                    st.error("You have not setup an account yet, please signup first and comeback")
                    st.stop()
                # If the user has set a password.
                else:
                    pwd = st.text_input("password", type='password')
                    salt = list(salt_key.keys())[0]
                    orig_key = list(salt_key.values())[0]
                    entered_key = get_key(salt, pwd)
                    if entered_key != orig_key:
                        dummy = st.button("Submit", key='pwd_dummy')
                        st.error("Please enter the correct password")
                        st.stop()
            if token != 'admin':
                st.session_state['user_langs'] = profile_dict[token]['iso_codes']
            return token

def signup(session_state=st.session_state):
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
        
def simple_auth():
    with st.sidebar.expander('User Management'):
        temp_header = st.empty()
        if 'current_project' in st.session_state:
            operation_idx = st.session_state.get('operation', 0)
            st.write('tetsvgej')
            st.session_state['operation'] = temp_header.selectbox('Choose your operation',['Select','Login','Signup'],index=operation_idx)
        else:
            st.session_state['operation'] = temp_header.selectbox('Choose your operation',['Select','Login','Signup'],index=0)


    if st.session_state['operation'] == 'Select':
        st.stop()
    elif st.session_state['operation'] == 'Login':
        token = login()
        temp_header.empty()
        return token
    elif st.session_state['operation'] == 'Signup':
        result = signup()
        
        return ''




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