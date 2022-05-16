labeled_data_table_id = "regrets-reporter-dev.ra_can_write.labelled_ra"
embeddings_table_id = 'regrets-reporter-dev.regrets_reporter_analysis.derived_fields_v1'
yt_data_table_id = "regrets-reporter-dev.regrets_reporter_analysis.yt_api_data_v9_filled_deduped"
language_table_id = 'regrets-reporter-dev.ra_can_read.langs'

# Get labelled pairs that have non-English video in format for bi-encoder model.
def get_be_labeled_pairs(context):
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
        INNER JOIN
            `{language_table_id}` reg_l_t
        ON regret_id=reg_l_t.video_id
        INNER JOIN
            `{language_table_id}` rec_l_t
        ON recommendation_id=rec_l_t.video_id
        WHERE
            (reg_l_t.description_lang != 'en' OR rec_l_t.description_lang != 'en')
    
    '''

    data = context['bq_client'].query(
        _query
    ).result(
    ).to_dataframe(
        bqstorage_client=context['bq_storage_client']
    )

    data = data.query("label != 'Unsure")
    data['label'] = data['label'].map({"Acceptable Recommendation": 0, "Bad recommendation": 1})
    data['channel_sim'] = data['channel_sim'].astype(int)


# Get English-only labelled pairs in format for unified cross-encoder model.
def get_xe_labeled_pairs(context):
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
        INNER JOIN
            `{language_table_id}` reg_l_t
        ON regret_id=reg_l_t.video_id
        INNER JOIN
            `{language_table_id}` rec_l_t
        ON recommendation_id=rec_l_t.video_id
        WHERE
            (reg_l_t.description_lang = 'en' AND rec_l_t.description_lang = 'en')
    '''

    data = context['bq_client'].query(
        _query
    ).result(
    ).to_dataframe(
        bqstorage_client=context['bq_storage_client']
    )

    data = data.query("label != 'Unsure")
    data['label'] = data['label'].map({"Acceptable Recommendation": 0, "Bad recommendation": 1})
    data['channel_sim'] = data['channel_sim'].astype(int)

