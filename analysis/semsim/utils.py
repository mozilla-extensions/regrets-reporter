import gcld3

# Remove all pairs from data that have languages other than that specified.
def filter_lang(data, with_transcript, lang):
    detector = gcld3.NNetLanguageIdentifier(min_num_bytes=0, max_num_bytes=1000)
    processed_data = data.copy(deep=True)
    for part in ['regret_title', 'recommendation_title', 'regret_description', 'recommendation_description'] + ['regret_transcript', 'recommendation_transcript'] if with_transcript else []:
        processed_data = processed_data[
            (processed_data[part].str.len() < 10) |
            [detector.FindLanguage(text=x).language == lang for x in processed_data[part]]
        ]
    return processed_data