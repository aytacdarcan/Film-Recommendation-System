# Film Önerme Uygulaması (Movie Recommendation App)

Bu proje, kullanıcılara izledikleri filmlere benzer içerikler sunan tam yığın (full-stack) bir web uygulamasıdır. İçerik tabanlı filtreleme (TF-IDF) algoritması yerel bir CSV veri seti üzerinde çalışırken, filmlerin görsel materyalleri (afişler vb.) dinamik olarak TMDB API üzerinden çekilmektedir.

##  Proje Hakkında
Uygulama, hız ve performans optimizasyonu amacıyla ana film verilerini yerel bir `.csv` dosyasından okur. Scikit-learn kullanılarak hesaplanan benzerlik skorlarına göre listelenen filmlerin afiş ve medya dosyaları eşzamanlı olarak TMDB API aracılığıyla arayüze aktarılır.

## 🛠️ Seçilen Teknolojiler ve Geliştirme Ortamı

Proje geliştirilirken aşağıdaki teknoloji yığını (stack) tercih edilmiştir:

* **Frontend:** HTML5, CSS3, JavaScript (Vanilla JS) & Fetch API.
* **Backend:** Python 3.x ve Flask Framework.
* **Makine Öğrenmesi/Veri İşleme:** Scikit-learn (TF-IDF Vectorizer) ve Pandas (CSV işleme).
* **Veri Kaynağı:**
  * Metin ve Özellik Verisi: Yerel `.csv` veri seti.
  * Medya/Görsel Verisi: TMDB (The Movie Database) API.
* **Geliştirme Araçları:** Visual Studio Code, Git & GitHub.

##  Kurulum ve Çalıştırma Rehberi

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin:

### 1. Bağımlılıkların Yüklenmesi
Projeyi klonladıktan sonra bir sanal ortam oluşturun ve gerekli kütüphaneleri yükleyin:

```bash
# Sanal ortam oluşturma
python -m venv venv

# Sanal ortamı aktif etme (Windows)
venv\Scripts\activate

# Gerekli kütüphaneleri yükleme
pip install flask requests scikit-learn pandas flask-cors
