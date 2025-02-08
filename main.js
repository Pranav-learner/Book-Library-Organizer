const API_URL = "https://www.googleapis.com/books/v1/volumes?q=";
const LIBRARY_STORAGE_KEY = "myBookLibrary";

console.log('Hello from main.js');


class BookLibrary {
    constructor() {
        this.myLibrary = this.loadLibrary();
        this.searchResults = [];
        this.initializeElements();
        this.bindEvents();
        this.renderLibrary();
    }

    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.searchButton = document.getElementById('searchButton');
        this.searchResultsContainer = document.querySelector('#searchResults .books-grid');
        this.categoryContainers = {
            toRead: document.querySelector('#toRead .books-grid'),
            reading: document.querySelector('#reading .books-grid'),
            completed: document.querySelector('#completed .books-grid')
        };
    }

    bindEvents() {
        this.searchButton.addEventListener('click', () => this.searchBooks());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchBooks();
        });
    }

    async searchBooks() {
        const query = this.searchInput.value.trim();
        if (!query) return;

        try {
            const response = await fetch(`${API_URL}${encodeURIComponent(query)}`);
            const data = await response.json();
            this.searchResults = data.items || [];
            this.renderSearchResults();
        } catch (error) {
            console.error('Error searching books:', error);
            this.searchResultsContainer.innerHTML = '<p>Error searching books. Please try again.</p>';
        }
    }

    renderSearchResults() {
        this.searchResultsContainer.innerHTML = '';
        
        this.searchResults.forEach(book => {
            const volumeInfo = book.volumeInfo;
            const bookCard = this.createBookCard({
                id: book.id,
                title: volumeInfo.title,
                authors: volumeInfo.authors?.join(', ') || 'Unknown Author',
                coverUrl: volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover',
                isLibraryBook: false
            });
            this.searchResultsContainer.appendChild(bookCard);
        });
    }

    createBookCard(book) {
        const card = document.createElement('div');
        card.className = 'book-card';
        
        const isInLibrary = this.myLibrary.some(libBook => libBook.id === book.id);
        
        card.innerHTML = `
            <img src="${book.coverUrl}" alt="${book.title} cover">
            <h3>${book.title}</h3>
            <p>${book.authors}</p>
            <div class="book-actions">
                ${book.isLibraryBook ? `
                    <select class="category-select">
                        <option value="toRead" ${book.category === 'toRead' ? 'selected' : ''}>To Read</option>
                        <option value="reading" ${book.category === 'reading' ? 'selected' : ''}>Reading</option>
                        <option value="completed" ${book.category === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                    <button class="remove-btn">Remove</button>
                ` : `
                    <button class="save-btn" ${isInLibrary ? 'disabled' : ''}>
                        ${isInLibrary ? 'Already Saved' : 'Save to Library'}
                    </button>
                `}
            </div>
        `;

        if (book.isLibraryBook) {
            const select = card.querySelector('.category-select');
            const removeBtn = card.querySelector('.remove-btn');

            select.addEventListener('change', (e) => {
                this.moveBook(book.id, e.target.value);
            });

            removeBtn.addEventListener('click', () => {
                this.removeBook(book.id);
            });
        } else {
            const saveBtn = card.querySelector('.save-btn');
            if (!isInLibrary) {
                saveBtn.addEventListener('click', () => {
                    this.addBook({
                        id: book.id,
                        title: book.title,
                        authors: book.authors,
                        coverUrl: book.coverUrl,
                        category: 'toRead'
                    });
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Already Saved';
                });
            }
        }

        return card;
    }

    addBook(book) {
        this.myLibrary.push(book);
        this.saveLibrary();
        this.renderLibrary();
    }

    removeBook(bookId) {
        this.myLibrary = this.myLibrary.filter(book => book.id !== bookId);
        this.saveLibrary();
        this.renderLibrary();
    }

    moveBook(bookId, newCategory) {
        const book = this.myLibrary.find(book => book.id === bookId);
        if (book) {
            book.category = newCategory;
            this.saveLibrary();
            this.renderLibrary();
        }
    }

    renderLibrary() {
        // Clear all category containers
        Object.values(this.categoryContainers).forEach(container => {
            container.innerHTML = '';
        });

        // Render books in their respective categories
        this.myLibrary.forEach(book => {
            const bookCard = this.createBookCard({
                ...book,
                isLibraryBook: true
            });
            this.categoryContainers[book.category].appendChild(bookCard);
        });
    }

    loadLibrary() {
        const savedLibrary = localStorage.getItem(LIBRARY_STORAGE_KEY);
        return savedLibrary ? JSON.parse(savedLibrary) : [];
    }

    saveLibrary() {
        localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(this.myLibrary));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BookLibrary();
});