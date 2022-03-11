# youtubeRegrets

### Overview

This repository holds the code for the backend, frontend which includes the modelling and Active learning wrapper around it. The frontend is developed using the 'amazing' *streamlit*  and the backend data is stored in a sqlite3 database. 

The frontend that we developed is for the Research Assistants to go through the datapoints and classify the text. All the RAs interactions will be stored in the database and use the labelled data for training the models. 

Once the model is fitted, test the accuracy and f1 scores. If the performance is not upto the expectations, then we'll trigger the active learning function to select more datapoints for further labeling. This loop is repeated untill the model performs to our expectations. 

