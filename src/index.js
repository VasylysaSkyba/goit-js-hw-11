import './css/styles.css';
// Описаний в документації
import SimpleLightbox from 'simplelightbox';
// Додатковий імпорт стилів
import 'simplelightbox/dist/simple-lightbox.min.css';
import Notiflix from 'notiflix';
import { PixabayApiService } from './js/pixabay-api';

const refs = {
  searchForm: document.querySelector('.search-form'),
  searchBtn: document.querySelector('.search-btn'),
  loadMoreBtn: document.querySelector('.load-more'),
  gallery: document.querySelector('.gallery'),
};

const pixabayApiService = new PixabayApiService();

const simpleLightbox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionDelay: 250,
});

loadMoreBtnHidden();

refs.searchForm.addEventListener('submit', handleSearch);
refs.loadMoreBtn.addEventListener('click', handleLoadMore);

async function handleSearch(event) {
  event.preventDefault();

  const searchValue = event.target.elements.searchQuery.value.trim();

  if (!searchValue) {
    Notiflix.Notify.info('Please input your request!');
    return;
  }

  pixabayApiService.resetPage();
  pixabayApiService.setSearchValue(searchValue);

  try {
    const {
      data: { hits, totalHits },
    } = await pixabayApiService.getImages();

    if (!hits.length) {
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      refs.gallery.innerHTML = '';
      return loadMoreBtnHidden();
    }

    pixabayApiService.setTotalHits(totalHits);

    Notiflix.Notify.success(`Hooray! We found ${totalHits} images.`);

    const imagesMarkup = getImagesMarkup(hits);

    refs.gallery.innerHTML = imagesMarkup;
    simpleLightbox.refresh();

    pixabayApiService.checkLastPage() ? loadMoreBtnHidden() : loadMoreBtnShow();
  } catch (error) {
    console.log(error);
  }
}

async function handleLoadMore() {
  pixabayApiService.incrementPage();
  try {
    const {
      data: { hits },
    } = await pixabayApiService.getImages();
    const markup = getImagesMarkup(hits);
    refs.gallery.insertAdjacentHTML('beforeend', markup);
    simpleLightbox.refresh();
    pixabayApiService.checkLastPage() ? loadMoreBtnHidden() : loadMoreBtnShow();
  } catch (error) {
    console.log(error.message);
  }
}

function loadMoreBtnHidden() {
  refs.loadMoreBtn.style.display = 'none';
}
function loadMoreBtnShow() {
  refs.loadMoreBtn.style.display = 'block';
}

function getImagesMarkup(array) {
  return array
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) =>
        `<a class="gallery-item" href="${largeImageURL}">
            <div class="photo-card">
              <img class="img-item" src="${webformatURL}" alt="${tags}" loading="lazy" />
              <div class="info">
                <p class="info-item">
                  <b>Likes</b>${likes}
                </p>
                <p class="info-item">
                  <b>Views</b>${views}
                </p>
                <p class="info-item">
                  <b>Comments</b>${comments}
                </p>
                <p class="info-item">
                  <b>Downloads</b>${downloads}
                </p>
              </div>
            </div>
          </a>`
    )
    .join('');
}
