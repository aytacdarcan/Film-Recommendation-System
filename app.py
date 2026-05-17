from pathlib import Path

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from fetch_movies import new_df

ROOT = Path(__file__).resolve().parent

app = Flask(__name__)
CORS(app)


@app.route("/")
def index():
    return send_from_directory(ROOT, "index.html")


@app.route("/style.css")
def style():
    return send_from_directory(ROOT, "style.css")


@app.route("/script.js")
def script():
    return send_from_directory(ROOT, "script.js")

# TfidfVectorizer: Nadir ve önemli kelimelere daha fazla ağırlık verir
tfidf = TfidfVectorizer(max_features=5000, stop_words='english')
vectors = tfidf.fit_transform(new_df['tags']).toarray()
similarity = cosine_similarity(vectors)


@app.route("/search/<movie>")
def search(movie):
    movie_data = new_df[new_df['title'].str.lower() == movie.strip().lower()]
    if movie_data.empty: return jsonify({"error": "Film bulunamadı"})
    row = movie_data.iloc[0]
    return jsonify({
        "movie_id": int(row['movie_id']),
        "title": row['title'],
        "overview": row['overview'],
        "year": row['year'],
        "runtime": int(row['runtime']) if pd.notna(row['runtime']) else 0,
        "genres": row['genres'],
        "cast": row['cast'],
        "director": row['director']
    })


@app.route("/similar/<movie>")
def similar(movie):
    movie_data = new_df[new_df['title'].str.lower() == movie.strip().lower()]
    if movie_data.empty: return jsonify({"error": "Film bulunamadı"})

    index = movie_data.index[0]
    distances = similarity[index]

    # En benzer 5 filmi alıyoruz
    movies_list = sorted(list(enumerate(distances)), reverse=True, key=lambda x: x[1])[1:6]

    # Normalizasyon: En benzer filmi %100 kabul ederek oranlama yapıyoruz
    max_sim = movies_list[0][1] if movies_list[0][1] > 0 else 1

    result = []
    for i in movies_list:
        row = new_df.iloc[i[0]]
        relative_score = int((i[1] / max_sim) * 100)

        result.append({
            "movie_id": int(row['movie_id']),
            "title": row['title'],
            "year": row['year'],
            "score": relative_score,
            "director": row['director'],
            "genres": row['genres'],
            "cast": row['cast'],
            "overview": row['overview']
        })
    return jsonify(result)


@app.route("/autocomplete/<query>")
def autocomplete(query):
    matched = new_df[new_df["title"].str.contains(query, case=False, na=False)].head(10)
    return jsonify(matched[['movie_id', 'title', 'year', 'director']].to_dict(orient='records'))


if __name__ == '__main__':
    app.run(debug=True)