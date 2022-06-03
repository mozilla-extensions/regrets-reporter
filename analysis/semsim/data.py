import pickle

labeled_data_table_id = 'regrets-reporter-dev.ra_can_write.labelled_ra'
embeddings_table_id = 'regrets-reporter-dev.regrets_reporter_analysis.derived_fields_v1'
yt_data_table_id = 'regrets-reporter-dev.regrets_reporter_analysis.yt_api_data_can'
language_table_id = 'regrets-reporter-dev.ra_can_read.langs'
pairs_table_id = 'regrets-reporter-dev.regrets_reporter_analysis.pairs'


# Get labelled pairs in format for training bi-encoder model.
def get_be_labeled_pairs(context, get_only_non_english_data=True, return_data_type='dataframe'):
    if return_data_type not in ['dataframe', 'arrow', 'arrow_streaming']:
        raise ValueError(
            f'return_data_type={return_data_type} is not allowed. Only "dataframe", "arrow" and "arrow_streaming" is allowed.')
    _query = f'''
        SELECT
            regret_id,
            recommendation_id,
            label,
            ( 
                SELECT 
                    SUM(value1 * value2)/ 
                    SQRT(SUM(value1 * value1))/ 
                    SQRT(SUM(value2 * value2))
                FROM
                    UNNEST(reg_f_t.title_embedding) value1 WITH OFFSET pos1 
                JOIN
                    UNNEST(rec_f_t.title_embedding) value2 WITH OFFSET pos2 
                ON pos1 = pos2
            ) AS title_sim,
            ( 
                SELECT 
                    SUM(value1 * value2)/ 
                    SQRT(SUM(value1 * value1))/ 
                    SQRT(SUM(value2 * value2))
                FROM
                    UNNEST(reg_f_t.thumbnail_embedding) value1 WITH OFFSET pos1 
                JOIN
                    UNNEST(rec_f_t.thumbnail_embedding) value2 WITH OFFSET pos2 
                ON pos1 = pos2
            ) AS thumbnail_sim,
            ( 
                SELECT 
                    SUM(value1 * value2)/ 
                    SQRT(SUM(value1 * value1))/ 
                    SQRT(SUM(value2 * value2))
                FROM
                    UNNEST(reg_f_t.description_embedding) value1 WITH OFFSET pos1 
                JOIN
                    UNNEST(rec_f_t.description_embedding) value2 WITH OFFSET pos2 
                ON pos1 = pos2
            ) AS description_sim,
            ( 
                SELECT 
                    SUM(value1 * value2)/ 
                    SQRT(SUM(value1 * value1))/ 
                    SQRT(SUM(value2 * value2))
                FROM
                    UNNEST(reg_f_t.transcript_embedding) value1 WITH OFFSET pos1 
                JOIN
                    UNNEST(rec_f_t.transcript_embedding) value2 WITH OFFSET pos2 
                ON pos1 = pos2
            ) AS transcript_sim,
            IF(reg_c_t.channel = rec_c_t.channel, 1, 0) AS channel_sim
        FROM
            `{labeled_data_table_id}`
        INNER JOIN
            `{embeddings_table_id}` reg_f_t
        ON regret_id=reg_f_t.video_id
        INNER JOIN
            `{embeddings_table_id}` rec_f_t
        ON recommendation_id=rec_f_t.video_id
        INNER JOIN
            `{yt_data_table_id}` reg_c_t
        ON regret_id=reg_c_t.video_id
        INNER JOIN
            `{yt_data_table_id}` rec_c_t
        ON recommendation_id=rec_c_t.video_id
        {f"INNER JOIN `{language_table_id}` reg_l_t ON regret_id=reg_l_t.video_id INNER JOIN `{language_table_id}` rec_l_t ON recommendation_id=rec_l_t.video_id" if get_only_non_english_data else ""}
        {"WHERE (reg_l_t.description_lang != 'en' OR rec_l_t.description_lang != 'en')" if get_only_non_english_data else ""}
    
    '''

    data = context['bq_client'].query(
        _query
    ).result()
    if return_data_type == 'dataframe':
        data = data.to_dataframe(
            bqstorage_client=context['bq_storage_client']
        )
        data = data.query("label != 'Unsure'")
        data.loc[:, 'label'] = data['label'].map(
            {"Acceptable Recommendation": 0, "Bad recommendation": 1})
        data.loc[:, 'channel_sim'] = data['channel_sim'].astype(int)
    elif return_data_type == 'arrow_table':
        data = data.to_arrow(
            bqstorage_client=context['bq_storage_client']
        )
    elif return_data_type == 'arrow_streaming':
        data = data.to_arrow_iterable(
            bqstorage_client=context['bq_storage_client']
        )
    else:
        raise ValueError(
            f'return_data_type={return_data_type} is not allowed. Only "dataframe", "arrow" and "arrow_streaming" is allowed.')

    return data


# Get video pairs in format for predicting with the bi-encoder model.
def get_be_predict_data(context, with_transcript, get_only_non_english_data=True, return_data_type='dataframe', sample_rate=None):
    if return_data_type not in ['dataframe', 'arrow', 'arrow_streaming']:
        raise ValueError(
            f'return_data_type={return_data_type} is not allowed. Only "dataframe", "arrow" and "arrow_streaming" is allowed.')
    _query = f'''
        WITH data_t AS (
        SELECT
            regret_id,
            recommendation_id,
            ( 
                SELECT 
                    SUM(value1 * value2)/ 
                    SQRT(SUM(value1 * value1))/ 
                    SQRT(SUM(value2 * value2))
                FROM
                    UNNEST(reg_e_t.title_embedding) value1 WITH OFFSET pos1 
                JOIN
                    UNNEST(rec_e_t.title_embedding) value2 WITH OFFSET pos2 
                ON pos1 = pos2
            ) AS title_sim,
            ( 
                SELECT 
                    SUM(value1 * value2)/ 
                    SQRT(SUM(value1 * value1))/ 
                    SQRT(SUM(value2 * value2))
                FROM
                    UNNEST(reg_e_t.thumbnail_embedding) value1 WITH OFFSET pos1 
                JOIN
                    UNNEST(rec_e_t.thumbnail_embedding) value2 WITH OFFSET pos2 
                ON pos1 = pos2
            ) AS thumbnail_sim,
            ( 
                SELECT 
                    SUM(value1 * value2)/ 
                    SQRT(SUM(value1 * value1))/ 
                    SQRT(SUM(value2 * value2))
                FROM
                    UNNEST(reg_e_t.description_embedding) value1 WITH OFFSET pos1 
                JOIN
                    UNNEST(rec_e_t.description_embedding) value2 WITH OFFSET pos2 
                ON pos1 = pos2
            ) AS description_sim,
            ( 
                SELECT 
                    SUM(value1 * value2)/ 
                    SQRT(SUM(value1 * value1))/ 
                    SQRT(SUM(value2 * value2))
                FROM
                    UNNEST(reg_e_t.transcript_embedding) value1 WITH OFFSET pos1 
                JOIN
                    UNNEST(rec_e_t.transcript_embedding) value2 WITH OFFSET pos2 
                ON pos1 = pos2
            ) AS transcript_sim,
            IF(reg_c_t.channel = rec_c_t.channel, 1, 0) AS channel_sim
        FROM
            `{pairs_table_id}`
        INNER JOIN
            `{embeddings_table_id}` reg_e_t
        ON
            regret_id = reg_e_t.video_id
        INNER JOIN
            `{embeddings_table_id}` rec_e_t
        ON
            recommendation_id = rec_e_t.video_id
        INNER JOIN
            `{yt_data_table_id}` reg_c_t
        ON regret_id=reg_c_t.video_id
        INNER JOIN
            `{yt_data_table_id}` rec_c_t
        ON recommendation_id=rec_c_t.video_id
        {f"LEFT JOIN `{language_table_id}` reg_l_t ON regret_id = reg_l_t.video_id LEFT JOIN `{language_table_id}` rec_l_t ON recommendation_id = rec_l_t.video_id" if get_only_non_english_data else ""}
        {"WHERE (reg_l_t.description_lang != 'en' OR rec_l_t.description_lang != 'en')" if get_only_non_english_data else ""}
        )
        SELECT
        * {"EXCEPT (transcript_sim)" if not with_transcript else ""}
        FROM
        data_t
        WHERE
        {"NOT IS_NAN(transcript_sim)" if with_transcript else "transcript_sim IS NULL"}
        {f"AND ABS(MOD(FARM_FINGERPRINT(regret_id), {sample_rate})) = 0" if sample_rate else ""}
    '''

    data = context['bq_client'].query(
        _query
    ).result()
    if return_data_type == 'dataframe':
        data = data.to_dataframe(
            bqstorage_client=context['bq_storage_client']
        )
    elif return_data_type == 'arrow_table':
        data = data.to_arrow(
            bqstorage_client=context['bq_storage_client']
        )
    elif return_data_type == 'arrow_streaming':
        data = data.to_arrow_iterable(
            bqstorage_client=context['bq_storage_client']
        )
    else:
        raise ValueError(
            f'return_data_type={return_data_type} is not allowed. Only "dataframe", "arrow" and "arrow_streaming" is allowed.')
    return data


# Get labelled pairs in format for training unified cross-encoder model.
def get_xe_labeled_pairs(context, get_only_english_data=False, return_data_type='dataframe'):
    if return_data_type not in ['dataframe', 'arrow', 'arrow_streaming']:
        raise ValueError(
            f'return_data_type={return_data_type} is not allowed. Only "dataframe", "arrow" and "arrow_streaming" is allowed.')
    _query = f'''
        SELECT
            regret_id,
            recommendation_id,
            label,
            reg_c_t.title AS regret_title,
            rec_c_t.title AS recommendation_title,
            reg_c_t.thumbnail AS regret_thumbnail,
            rec_c_t.thumbnail AS recommendation_thumbnail,
            reg_c_t.description AS regret_description,
            rec_c_t.description AS recommendation_description,
            reg_c_t.transcript AS regret_transcript,
            rec_c_t.transcript AS recommendation_transcript,
            IF(reg_c_t.channel = rec_c_t.channel, 1, 0) AS channel_sim
        FROM
            `{labeled_data_table_id}`
        INNER JOIN
            `{yt_data_table_id}` reg_c_t
        ON regret_id=reg_c_t.video_id
        INNER JOIN
            `{yt_data_table_id}` rec_c_t
        ON recommendation_id=rec_c_t.video_id
        {f"INNER JOIN `{language_table_id}` reg_l_t ON regret_id=reg_l_t.video_id INNER JOIN `{language_table_id}` rec_l_t ON recommendation_id=rec_l_t.video_id" if get_only_english_data else ""}
        {"WHERE (reg_l_t.description_lang = 'en' AND rec_l_t.description_lang = 'en')" if get_only_english_data else ""}
    '''

    data = context['bq_client'].query(
        _query
    ).result()
    if return_data_type == 'dataframe':
        data = data.to_dataframe(
            bqstorage_client=context['bq_storage_client']
        )
        data.loc[:, 'channel_sim'] = data['channel_sim'].astype(
            int)  # may not be needed anymore
    elif return_data_type == 'arrow_table':
        data = data.to_arrow(
            bqstorage_client=context['bq_storage_client']
        )
    elif return_data_type == 'arrow_streaming':
        data = data.to_arrow_iterable(
            bqstorage_client=context['bq_storage_client']
        )
    else:
        raise ValueError(
            f'return_data_type={return_data_type} is not allowed. Only "dataframe", "arrow" and "arrow_streaming" is allowed.')

    return data


# Get video pairs in format for predicting with the unified cross-encoder model.
def get_xe_predict_data(context, with_transcript, get_only_english_data=False, return_data_type='dataframe', sample_rate=None):
    if return_data_type not in ['dataframe', 'arrow', 'arrow_streaming']:
        raise ValueError(
            f'return_data_type={return_data_type} is not allowed. Only "dataframe", "arrow" and "arrow_streaming" is allowed.')
    _query = f'''
        SELECT
            regret_id,
            recommendation_id,
            reg_c_t.title AS regret_title,
            rec_c_t.title AS recommendation_title,
            reg_c_t.thumbnail AS regret_thumbnail,
            rec_c_t.thumbnail AS recommendation_thumbnail,
            reg_c_t.description AS regret_description,
            rec_c_t.description AS recommendation_description,
            reg_c_t.transcript AS regret_transcript,
            rec_c_t.transcript AS recommendation_transcript,
            IF(reg_c_t.channel = rec_c_t.channel, 1, 0) AS channel_sim
        FROM
            `{pairs_table_id}`
        INNER JOIN
            `{yt_data_table_id}` reg_c_t
        ON regret_id=reg_c_t.video_id
        INNER JOIN
            `{yt_data_table_id}` rec_c_t
        ON recommendation_id=rec_c_t.video_id
        {f"LEFT JOIN `{language_table_id}` reg_l_t ON regret_id = reg_l_t.video_id LEFT JOIN `{language_table_id}` rec_l_t ON recommendation_id = rec_l_t.video_id" if get_only_english_data else ""}
        WHERE
        {"(reg_c_t.transcript IS NOT NULL AND rec_c_t.transcript IS NOT NULL)" if with_transcript else "(reg_c_t.transcript IS NULL OR rec_c_t.transcript IS NULL)"}
        {"AND (reg_l_t.description_lang = 'en' AND rec_l_t.description_lang = 'en')" if get_only_english_data else ""}
        {f"AND ABS(MOD(FARM_FINGERPRINT(regret_id), {sample_rate})) = 0" if sample_rate else ""}
    '''

    data = context['bq_client'].query(
        _query
    ).result()
    if return_data_type == 'dataframe':
        data = data.to_dataframe(
            bqstorage_client=context['bq_storage_client']
        )
        data.loc[:, 'channel_sim'] = data['channel_sim'].astype(
            int)  # may not be needed anymore
    elif return_data_type == 'arrow_table':
        data = data.to_arrow(
            bqstorage_client=context['bq_storage_client']
        )
    elif return_data_type == 'arrow_streaming':
        data = data.to_arrow_iterable(
            bqstorage_client=context['bq_storage_client']
        )
    else:
        raise ValueError(
            f'return_data_type={return_data_type} is not allowed. Only "dataframe", "arrow" and "arrow_streaming" is allowed.')

    return data


def save_data(data, pickle_file, context):
    with open(context['gdrive_path'] + pickle_file, 'wb') as handle:
        pickle.dump(data, handle,
                    protocol=pickle.HIGHEST_PROTOCOL)


def load_data(pickle_file, context):
    with open(context['gdrive_path'] + pickle_file, 'rb') as handle:
        return pickle.load(handle)
