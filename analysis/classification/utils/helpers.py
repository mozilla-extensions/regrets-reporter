import os
cwd = os.getcwd().split('/')
user_dir = '/'.join(cwd[:3]) 
repo_dir = f'{user_dir}/repos/youtubeRegrets'
data_dir = f'{repo_dir}/data'
