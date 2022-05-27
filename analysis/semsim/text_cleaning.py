from fastcore.basics import listify
from fastcore.utils import compose
import unicodedata
from string import punctuation
import html
from itertools import groupby
import re

control_char_regex = re.compile(r'[\r\n\t]+')
url_regex = re.compile(
    r'((http|https)\:\/\/)?[a-zA-Z0-9\.\/\?\:@\-_=#]+\.([a-zA-Z]){2,6}([a-zA-Z0-9\.\&\/\?\:@\-_=#])*')
username_regex = re.compile(r'(^|[^@\w])@(\w{1,15})\b')


def fix_html(text):
    tmp_ls = []
    for e in listify(text):
        e = e.replace('#39;', "'").replace('amp;', '&').replace('#146;', "'").replace('nbsp;', ' ').replace(
            '#36;', '$').replace('\\n', "\n").replace('quot;', "'").replace('<br />', "\n").replace(
            '\\"', '"').replace('<unk>', ' ').replace(' @.@ ', '.').replace(' @-@ ', '-').replace('...', ' …')
        tmp_ls.append(html.unescape(e))

    text = tmp_ls
    return text


def remove_control_char(text):
    tmp_ls = []
    for e in listify(text):
        tmp_ls.append(re.sub(control_char_regex, '.', e))

    text = tmp_ls
    return text


def remove_remaining_control_chars(text):
    tmp_ls = []
    for e in listify(text):
        tmp_ls.append(
            ''.join(ch for ch in e if unicodedata.category(ch)[0] != 'C'))

    text = tmp_ls
    return text


def remove_unicode_symbols(text):
    tmp_ls = []
    for e in listify(text):
        tmp_ls.append(
            ''.join(ch for ch in e if unicodedata.category(ch)[0] != 'So'))

    text = tmp_ls
    return text


def standardise_punc(text):
    transl_table = dict([(ord(x), ord(y))
                         for x, y in zip(u"‘’´“”–-",  u"'''\"\"--")])
    tmp_ls = []
    for e in listify(text):
        e = e.translate(transl_table)
        tmp_ls.append(e)

    text = tmp_ls
    return text


def remove_news_tags(text):
    tmp_ls = []
    for e in listify(text):
        e = re.sub(r"(<[A-Z].+?>)|(</[A-Z].+?>)", "", e)
        tmp_ls.append(e)

    text = tmp_ls
    return text


def replace_urls(text):
    filler, tmp_ls = '', []
    for e in listify(text):
        e = re.sub(r"(<a.+?>)|(</a>)|(<ref.+?>)", "", e)
        e = re.sub(url_regex, filler, e)
        tmp_ls.append(e)

    text = tmp_ls
    return text


def replace_usernames(text):
    filler, tmp_ls = '', []
    for e in listify(text):
        occ = e.count('@')
        for _ in range(occ):
            e = e.replace('@<user>', f'{filler}')
            # replace other user handles by filler
            e = re.sub(username_regex, filler, e)
        tmp_ls.append(e)

    text = tmp_ls
    return text


def remove_duplicate_punctuation(text):
    tmp_ls = []
    for e in listify(text):
        e = re.sub(r'\b(\w+)( \1\b)+', r'\1', e)
        punc = set(punctuation)
        newtext = []
        for k, g in groupby(e):
            if k in punc:
                newtext.append(k)
            else:
                newtext.extend(g)
        e = ''.join(newtext)
        tmp_ls.append(e)

    text = tmp_ls
    return text


def remove_multi_space(text):
    tmp_ls = []
    for e in listify(text):
        tmp_ls.append(' '.join(e.split()))

    text = tmp_ls
    return text


clean_text_funcs = compose(*[fix_html, remove_control_char, remove_remaining_control_chars, remove_unicode_symbols,
                            standardise_punc, remove_news_tags, replace_urls, replace_usernames, remove_duplicate_punctuation, remove_multi_space])
