# Security
#passlib,hashlib,bcrypt,scrypt
import hashlib
import streamlit as st
import pandas as pd
import time

import hashlib
import os
import pickle as pk
import streamlit as st
import time
import pickle as pk

# This expander will be invoked right when simple auth is imported into main.py
# putting it here will ensure that auth is right on top.


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
    with open('.streamlit/profile_dict.pk', 'wb') as f:
        pk.dump(profile_dict, f)
    
    return None

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
        st.success(f'Sucessfully Deleted {len(users_list)} users from the DB')

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

def simple_auth():
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
                pwd = st.text_input("password", type='password')
                if st.button('Login'):
                    st.write('')
                # They profile will not have the salt and key if the user has not set a password
                # Ask user to set password        
                if salt_key is None:
                    st.error("You have not set a password yet, please set one")
                    pwd2 = st.text_input("Please repeat your password", type="password")
                    if st.button("Set password"):
                        if pwd == pwd2:
                            set_key(token, pwd)
                            st.success("I've set the password for you.  Please contact admin if you have to reset it")
                            time.sleep(3)
                            st.experimental_rerun()
                        else:
                            st.warning("The two passwords you typed do not match.  Please correct.")
                    st.stop()
                # If the user has set a password.
                else:
                    salt = list(salt_key.keys())[0]
                    orig_key = list(salt_key.values())[0]

                    entered_key = get_key(salt, pwd)
                    if entered_key != orig_key:
                        #dummy = st.button("Submit", key='pwd_dummy')
                        #st.error("Please enter the correct password")
                        st.stop()
    return token



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