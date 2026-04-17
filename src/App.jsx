import { useState } from "react";
import Home from "./pages/Home";
import Search from "./pages/Search";
import SearchResults from "./pages/SearchResults";
import BookDetails from "./pages/BookDetails";
import "./styles/globals.css";

export default function App() {
  const [page, setPage] = useState("home");
  const [searchState, setSearchState] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);

  const navigate = (to, data = null) => {
    setPage(to);

    if (to === "results") {
      setSearchState(data);
    }

    if (to === "book") {
      setSelectedBook(data);
    }

    window.scrollTo(0, 0);
  };

  return (
    <div className="app">
      {page === "home" && <Home onEnter={() => navigate("search")} />}

      {page === "search" && (
        <Search
          onSearch={(data) => navigate("results", data)}
          onBookSelect={(book) => navigate("book", book)}
          onBackHome={() => navigate("home")}
        />
      )}

      {page === "results" && (
        <SearchResults
          searchState={searchState}
          onBack={() => navigate("search")}
          onBookSelect={(book) => navigate("book", book)}
        />
      )}

      {page === "book" && (
        <BookDetails
          book={selectedBook}
          onBack={() => navigate("results")}
          onSearch={() => navigate("search")}
        />
      )}
    </div>
  );
}
