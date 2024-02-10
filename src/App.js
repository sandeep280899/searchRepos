import React, { useState } from "react";
import './App.css';


const App = () => {
  const [repositories, setRepositories] = useState([]);
  const [packFlag, setPackFlag] = useState(0);
  const [dataFlag, setDataFlag] = useState(false);
  const [keyword, setKeyword] = useState("");



  const searchRepositories = async () => {
    // const keyword = document.getElementById("searchInput").value;

    if (!keyword) {
      alert(`Please Enter keyword.`);
      return false;
    }

    try {
      const response = await fetch(`https://api.github.com/search/repositories?q=${keyword}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      const data = await response.json();
      setRepositories(data.items);
      setDataFlag(true);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const importRepository = async (repoName, login, name) => {
    console.log("INSIDE1");
    // Your import logic here
    try {
      const response = await fetch(`https://api.github.com/repos/${login}/${name}/contents/package.json`);

      const data = await response.json();
      if (data.encoding === 'base64') {
        let decodedContent = atob(data.content);
        decodedContent = JSON.parse(decodedContent);

        // Retrieve existing keys and counts from local storage
        const existingKeysString = localStorage.getItem('existingKeys');
        const existingKeys = existingKeysString ? JSON.parse(existingKeysString) : {};

        // Retrieve already imported repository names
        const importedReposString = localStorage.getItem('importedRepos');
        const importedRepos = importedReposString ? JSON.parse(importedReposString) : [];

        // Check if the repository name is already imported
        if (!importedRepos.includes(repoName)) {
          // Update counts for dependencies
          for (const key of Object.keys(decodedContent.dependencies || {})) {
            if (existingKeys[key]) {
              existingKeys[key]++;
            } else {
              existingKeys[key] = 1;
            }
          }

          // Update counts for devDependencies
          for (const key of Object.keys(decodedContent.devDependencies || {})) {
            if (existingKeys[key]) {
              existingKeys[key]++;
            } else {
              existingKeys[key] = 1;
            }
          }

          // Add the repository name to the imported list
          importedRepos.push(repoName);

          localStorage.setItem('existingKeys', JSON.stringify(existingKeys));
          localStorage.setItem('importedRepos', JSON.stringify(importedRepos));

          setPackFlag(1);
        } else {
          alert(`Repository ${repoName} is already imported.`);
          return false;
        }
      } else {
        console.log('The repository does not contain a package.json file.');
      }
      if (data.name) {
        alert(`Repository ${repoName} imported successfully!`);
        return false;
      } else {
        alert(`This project does not contain a package.json file.`);
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };



  const displayRepositories = () => {
    // Retrieve already imported repository names from local storage
    const importedReposString = localStorage.getItem('importedRepos');
    const importedRepos = importedReposString ? JSON.parse(importedReposString) : [];

    return (
      <div>
        {repositories.length > 0 && dataFlag && (
          <table>
            <thead>
              <tr>
                <th>Repository Name</th>
                <th>Stars</th>
                <th>Forks</th>
                <th>Import</th>
              </tr>
            </thead>
            <tbody>
              {repositories.map(repo => (
                <tr key={repo.id} style={{ color: importedRepos.includes(repo.name) ? 'blue' : '' }}>
                  <td >{repo.name}</td>
                  <td>{repo.stargazers_count}</td>
                  <td>{repo.forks_count}</td>
                  <td>
                    <button onClick={() => importRepository(repo.name, repo.owner.login, repo.name)}>Import</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {repositories.length === 0 && dataFlag && (
          <div className="pt-20">
            No Data Found
          </div>
        )}
      </div>
    );
  };


  const displayPackages = () => {
    return (
      <div>
        {packFlag === 1 && (
          <>
            <button onClick={goBack}>Back</button>
            {displayCounts()}
          </>
        )}
      </div>
    );
  };
  const goBack = () => {
    setPackFlag(0);
  };

  const goToTop10 = () => {
    setPackFlag(1);
  }

  const setKeywordSearch = (e) => {
    setKeyword(e.target.value);
  }

  const displayCounts = () => {
    let existingPackages = localStorage.getItem("existingKeys");
    let counts = existingPackages ? JSON.parse(existingPackages) : {};
  
    // Sort entries based on count in descending order
    const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  
    return (
      <div>
        {Object.keys(counts).length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Package Name</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.slice(0, 10).map(([packageName, count]) => (
                <tr key={packageName}>
                  <td>{packageName}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="pt-20">No Data Found</div>
        )}
      </div>
    );
  };
  

  

  return (
    <div className="App">
      <header className="App-header">
        {packFlag === 0 && (
          <div className="search-container">
            <h1>Search Repositories</h1>
            <div className="search-bar">
              <input type="text" id="searchInput" placeholder="Enter keyword" onChange={(e) => setKeywordSearch(e)} value={keyword} />
              <button onClick={searchRepositories}>Search</button>
            </div>
            <button className="top-10-button" onClick={goToTop10}>View Top 10 Packages</button>
            {displayRepositories()}
          </div>
        )}
        {packFlag === 1 && (
          <div className="top-packages-container">
            <h1>Top Packages</h1>
            {displayPackages()}
          </div>
        )}
      </header>
    </div>

  );
};

export default App;
