document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const resultsDiv = document.getElementById('results');
    const modal = document.getElementById('movieModal');
    const closeBtn = document.querySelector('.close');
    const movieIframe = document.getElementById('movieIframe');

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        movieIframe.src = '';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            movieIframe.src = '';
        }
    });

    async function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        try {
            const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            displayResults(data.results);
        } catch (error) {
            console.error('Error searching movies:', error);
        }
    }

    function displayResults(movies) {
        resultsDiv.innerHTML = '';
        
        movies.forEach(movie => {
            if (movie.poster_path) {
                const movieCard = document.createElement('div');
                movieCard.className = 'movie-card';
                movieCard.innerHTML = `
                    <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
                    <div class="movie-info">
                        <h3>${movie.title}</h3>
                        <p>${movie.release_date.split('-')[0]}</p>
                    </div>
                `;

                movieCard.addEventListener('click', () => {
                    openMovie(movie.id);
                });

                resultsDiv.appendChild(movieCard);
            }
        });
    }

    function openMovie(movieId) {
        modal.style.display = 'block';
        movieIframe.src = `https://autoembed.co/movie/tmdb/${movieId}`;
    }
});
