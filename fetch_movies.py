import pandas as pd
import ast
from nltk.stem.porter import PorterStemmer

ps = PorterStemmer()

def stem(text):
    y = []
    for i in text.split():
        y.append(ps.stem(i))
    return " ".join(y)

# Veri Okuma ve Birleştirme
movies = pd.read_csv("tmdb_5000_movies.csv")
credits = pd.read_csv("tmdb_5000_credits.csv")
movies = movies.merge(credits, left_on="id", right_on="movie_id")

movies = movies[["movie_id", "title_x", "overview", "genres", "keywords", "cast", "crew", "release_date", "runtime"]]
movies = movies.rename(columns={"title_x": "title"})

# Yardımcı Fonksiyonlar
def convert(text):
    return [item["name"] for item in ast.literal_eval(text)]

def convert_cast(text):
    return [item["name"] for item in ast.literal_eval(text)[:3]]

def fetch_director(text):
    for item in ast.literal_eval(text):
        if item["job"] == "Director":
            return item["name"]
    return ""

def remove_space(items):
    return [i.replace(" ", "") for i in items]

# Veri Temizleme
movies.dropna(inplace=True)
movies["genres"] = movies["genres"].apply(convert)
movies["keywords"] = movies["keywords"].apply(convert)
movies["cast"] = movies["cast"].apply(convert_cast)
movies["director"] = movies["crew"].apply(fetch_director)
movies["year"] = movies["release_date"].apply(lambda x: str(x).split("-")[0])

# Temizleme ve Ağırlıklandırma (Boosting)
movies["genres_clean"] = movies["genres"].apply(remove_space)
movies["keywords_clean"] = movies["keywords"].apply(remove_space)
movies["cast_clean"] = movies["cast"].apply(remove_space)
movies["director_clean"] = movies["director"].apply(lambda x: x.replace(" ", ""))

# Önemli kolonları 3 kez tekrarlayarak benzerlik üzerindeki etkilerini artırıyoruz
movies["tags"] = (
    movies["overview"] + " " +
    (movies["genres_clean"].apply(lambda x: " ".join(x)) + " ") * 3 +
    movies["keywords_clean"].apply(lambda x: " ".join(x)) + " " +
    movies["cast_clean"].apply(lambda x: " ".join(x)) + " " +
    (movies["director_clean"] + " ") * 3
)

new_df = movies[["movie_id", "title", "overview", "genres", "cast", "director", "year", "runtime", "tags"]].copy()
new_df["tags"] = new_df["tags"].apply(lambda x: x.lower())
new_df["tags"] = new_df["tags"].apply(stem) # Kelime köklerine iniliyor