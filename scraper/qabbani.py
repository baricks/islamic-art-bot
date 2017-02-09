import bs4
import urllib2
from random import randint
import unicodedata as ud

# First run the code below for Goodreads quotes

latin_letters= {}

def is_latin(uchr):
    try: return latin_letters[uchr]
    except KeyError:
         return latin_letters.setdefault(uchr, 'LATIN' in ud.name(uchr))

def only_roman_chars(unistr):
    return all(is_latin(uchr)
           for uchr in unistr
           if uchr.isalpha())

baseUrl = "https://www.goodreads.com/author/quotes/238982.Nizar_Qabbani?page="

# Interate through various pages

for i in range(1,2):
    url = baseUrl + str(i)
    html = urllib2.urlopen(url).read()
    soup = bs4.BeautifulSoup(html, "html.parser")
    quotes = soup.findAll(class_="quoteText")
    for quote in quotes:
        if only_roman_chars(quote.text) is True:
            quote_final = quote.text.encode("utf-8")
            print quote_final
