const API_URL = "https://www.googleapis.com/books/v1/volumes?q=";
        const LIBRARY_STORAGE_KEY = "myBookLibrary";

        function searchBooks() {
            const query = document.getElementById("searchBar").value.trim();
            const genre = document.getElementById("genreSelect").value;

            if (!query && !genre) {
                displayAlert("Please enter a search term or select a genre.");
                return;
            }

            if (query && !query.replace(/\s/g, '').length) {
                displayAlert("Please enter a valid search query.");
                return;
            }

            let searchUrl = API_URL;
            if (query) {
                searchUrl += encodeURIComponent(query);
            }
            if (genre) {
                if (query) searchUrl += "+";
                searchUrl += `subject:${genre}`;
            }

            showLoadingIndicator();

            fetch(searchUrl)
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => {throw new Error(err.message || response.statusText)});
                    }
                    return response.json();
                })
                .then(data => {
                    hideLoadingIndicator();
                    if (!data || !data.items || data.items.length === 0) {
                        displayAlert("No books found.");
                    } else {
                        displayResults(data.items);
                    }
                })
                .catch(error => {
                    hideLoadingIndicator();
                    console.error("Error fetching data:", error);
                    displayAlert("An error occurred. Please try again later.");
                });
        }

        function displayResults(books) {
            const resultsDiv = document.getElementById("results");
            resultsDiv.innerHTML = "";

            if (!books || books.length === 0) {
                resultsDiv.innerHTML = "<p>No books found.</p>";
                return;
            }

            books.forEach(book => {
                const bookInfo = book.volumeInfo;

                let bookId;
                if (bookInfo.industryIdentifiers) {
                    const isbn13 = bookInfo.industryIdentifiers.find(id => id.type === "ISBN_13");
                    bookId = isbn13 ? isbn13.identifier : (bookInfo.industryIdentifiers.find(id => id.type === "ISBN_10")?.identifier || bookInfo.title.replace(/\s+/g, ""));
                } else {
                    bookId = bookInfo.title.replace(/\s+/g, "");
                }

                const bookData = {
                    id: bookId,
                    title: bookInfo.title,
                    authors: bookInfo.authors || ["Unknown Author"],
                    thumbnail: bookInfo.imageLinks?.thumbnail || "https://via.placeholder.com/100",
                    category: "To Read",
                    description: bookInfo.description || "No description available." // Include description
                };

                const bookElement = document.createElement("div");
                bookElement.className = "book";

                bookElement.innerHTML = `
                    <img src="${bookData.thumbnail}" alt="Book Cover">
                    <div class="book-details">
                        <h3>${escapeHtml(bookData.title)}</h3>
                        <p>${bookData.authors.map(author => escapeHtml(author)).join(", ")}</p>
                        <button onclick='saveBook(${JSON.stringify(bookData)})'>➕ Save</button>
                    </div>
                `;
                resultsDiv.appendChild(bookElement);
            });
        }

        function saveBook(book) {
            let library = JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY)) || [];
            const bookIds = new Set(library.map(savedBook => savedBook.id));
            if (bookIds.has(book.id)) {
                displayAlert("Book already in library!");
                return;
            }

            library.push(book);
            localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
            displayLibrary();
            showSuccessMessage("Book saved!");
        }

        function displayAlert(message) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert';
            alertDiv.innerHTML = `<span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span><strong>${message}</strong>`;
            document.body.insertBefore(alertDiv, document.body.firstChild);
        }

        function showLoadingIndicator() {
            document.querySelector('.loading-indicator').style.display = 'block';
        }

        function hideLoadingIndicator() {
            document.querySelector('.loading-indicator').style.display = 'none';
        }

        function showSuccessMessage(message) {
            const successMessage = document.querySelector('.success-message');
            successMessage.textContent = message;
            successMessage.style.display = 'block';

            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 3000);
        }

        function displayLibrary() {
            const toReadDiv = document.getElementById("toRead");
            const readingDiv = document.getElementById("reading");
            const finishedDiv = document.getElementById("finished");

            toReadDiv.innerHTML = "";
            readingDiv.innerHTML = "";
            finishedDiv.innerHTML = "";

            let library = JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY)) || [];
            library.forEach(book => {
                const bookElement = document.createElement("div");
                bookElement.className = "book";
                bookElement.innerHTML = `
                    <img src="${book.thumbnail}" alt="Book Cover">
                    <div class="book-details">
                        <h3>${escapeHtml(book.title)}</h3>
                        <p>${book.authors.map(author => escapeHtml(author)).join(", ")}</p>
                        <p class="progress">📌 ${book.category}</p>
                        <select onchange='updateCategory("${book.id}", this.value)'>
                            <option value="To Read" ${book.category === "To Read" ? "selected" : ""}>📌 To Read</option>
                            <option value="Reading" ${book.category === "Reading" ? "selected" : ""}>📖 Reading</option>
                            <option value="Finished" ${book.category === "Finished" ? "selected" : ""}>✅ Finished</option>
                        </select>
                        <button onclick='removeBook("${book.id}")'>🗑️ Remove</button>
                    </div>
                `;

                if (book.category === "To Read") {
                    toReadDiv.appendChild(bookElement);
                } else if (book.category === "Reading") {
                    readingDiv.appendChild(bookElement);
                } else if (book.category === "Finished") {
                    finishedDiv.appendChild(bookElement);
                }
            });
        }

        function updateCategory(bookId, newCategory) {
            let library = JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY)) || [];
            library = library.map(book => book.id === bookId ? { ...book, category: newCategory } : book);
            localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
            displayLibrary();
        }

        function removeBook(bookId) {
            let library = JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY)) || [];
            library = library.filter(book => book.id !== bookId);
            localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
            displayLibrary();
        }

        function escapeHtml(text) {
            return text
                ? text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")
                : "";
        }

        document.addEventListener("DOMContentLoaded", displayLibrary);