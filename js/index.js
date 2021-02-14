function getQuery() { //Get query from input boxes
  var basicSearch = $('#searchQuery').val().trim();
  var author = $('#authorSearch').val().trim() ? `+inauthor:${$('#authorSearch').val().trim()}` : '';
  var title = $('#titleSearch').val().trim() ? `+intitle:${$('#titleSearch').val().trim()}` : '';
  var publisher = $('#pubSearch').val().trim() ? `+inpublisher:${$('#pubSearch').val().trim()}` : '';
  var subject = $('#subjectSearch').val().trim() ? `+subject:${$('#subjectSearch').val().trim()}` : '';
  var isbn = $('#isbnSearch').val().trim() ? `+isbn:${$('#isbnSearch').val().trim()}` : '';
  return `${basicSearch}${author}${title}${publisher}${isbn}${subject}`;
}

async function getBooks() { //Get books from Google's API
  var query = getQuery();
  if (query != '') {
    await $.get(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=40&key=AIzaSyAUDi2XPJCOlyCHZVBHIOOnXyiFD8HlC24`)
      .done(function (data) {
        populateList(data);
        $('#endOfResults').css('display', 'block');
      })
      .fail(function (data) {
        showError(data.status);
      });
  } else {
    showError(400);
  }
}

function populateList(bookList) { //Add image for each book found by the GET request
  if (bookList.items != undefined) {
    $('#resultsList div').remove();
    bookList.items.forEach(book => {
      $('#resultsList').append(`<div class="col-md-3 container bookLink"><img src="${(book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : 'nobook.png')}" alt="Avatar" class="image"><div class="overlay"  onclick="loadBook(\'${book.id}\')"><div class="text">${(book.volumeInfo.title.length > 50 ? book.volumeInfo.title.substr(0, 50) + '...' : book.volumeInfo.title)}</div></div></div>`);
    });
  } else { //Show error if no results
    showError('No results found!');
  }
}

async function loadBook(volumeId) { //Get book based on single volumeId
  if (volumeId != undefined && volumeId.trim() != '' && volumeId.length == 12) {
    await $.get(`https://www.googleapis.com/books/v1/volumes/${volumeId}?key=AIzaSyAUDi2XPJCOlyCHZVBHIOOnXyiFD8HlC24`)
      .done(function (data) {
        $('#bookTitle').text(data.volumeInfo.title);
        $('#author').text(data.volumeInfo.authors ? data.volumeInfo.authors.toString().replace(',', '; ') : 'Author Unknown');
        $('#moreInfo').text('More Info')
        $('#moreInfo').attr('href', data.volumeInfo.infoLink);
        $('#publisher').text('Published by: ' + (data.volumeInfo.publisher || 'Unknown'));
        $('#bookDescription').html(data.volumeInfo.description || 'No summary available');
        $('#bookImage').attr('src', data.volumeInfo.imageLinks ? data.volumeInfo.imageLinks.thumbnail : 'nobook.png'); //If no image use a default cover
      }).fail(function () {
        showError('Issue retrieving volume from Google Books'); //API Error
      });
  } else {
    showError('Bad Book Id!'); //While this shouldn't ever be the case, still good to check
  }
}

function toggleAdvanced() { //Open and close advanced search panel
  var advSearch = $('#advancedSearch');
  if (advSearch.css('display') == 'none') {
    $('#advancedOpen').text('Hide Advanced Search');
    advSearch.css('display', 'block');
  } else {
    advSearch.css('display', 'none');
    $('#advancedOpen').text('Show Advanced Search');
  }
}

function showError(error) { //Display a toast to notify the user of any errors. 
  switch (error) { //Some custom cases to help user understand certain errors, otherwise just print the passed error
    case 400:
      var errorMesssage = 'Please enter a search term';
      break;
    case 403:
      var errorMesssage = 'The limit for searches through the API has been reached!';
      break;
    default:
      var errorMesssage = error;
      break;
  }
  $('#toast').addClass('show').text(errorMesssage);
  setTimeout(function () {
    $('#toast').removeClass('show');
  }, 3000);
}

//Function to run a variety of tests to make sure edge cases are covered - results will be printed in the console
async function runTests() { //Run list of tests
  await validQuery();
  await whiteSpaceQuery();
  await noQuery();
  await noResultQuery();
  await validVolume();
  await invalidVolume();
  await noVolume();
  await whiteSpaceVolume();
  $('#resultsList div').remove();
  $('#endOfResults').css('display', 'none');
};

async function validQuery() { //Pass a valid search query
  $('#searchQuery').val('hogfather');
  await getBooks().then(() => {
    if ($('.bookLink')[0] != undefined) { // Check if any books have been populated
      console.log('Success valid query');
    } else {
      console.log('Fail valid query');
    }
  });
}

async function whiteSpaceQuery() { // Pass a query of all whitespace
  $('#searchQuery').val('       ');
  await getBooks().then(() => {
    if ($('#toast').text() == 'Please enter a search term') {
      console.log('Success whitespace query');
    } else {
      console.log('Fail whitespace query');
    }
    $('#toast').removeClass('show').text('');
  });
}

async function noQuery() { // Pass an empty query
  $('#searchQuery').val('');
  await getBooks().then(() => {
    if ($('#toast').text() == 'Please enter a search term') {
      console.log('Success no query');
    } else {
      console.log('Fail no query');
    }
    $('#toast').removeClass('show').text('');
  });
}

async function noResultQuery() { //Test what happens when no results can be found
  $('#isbnSearch').val(0); //isbn is a 13 digit number - this will always return 0 results
  await getBooks().then(() => {
    if ($('#toast').text() == 'No results found!') {
      console.log('Success no results');
    } else {
      console.log('Fail no results');
    }
    $('#toast').removeClass('show').text('');
    $('#isbnSearch').val('');
  });
}

async function validVolume() {
  await loadBook('8l694yT6VZkC').then(() => { //Pass loadBook() known volumeId for Terry Pratchett's Hogfather
    if ($('#bookTitle').text() != '') {
      console.log('Success load valid volumeId');
    } else {
      console.log('Fail load valid volumeId');
    }
    resetVolume();
  });
}

async function invalidVolume() { //Pass loadBook() volumeId that does not meet length requirement of 12 digits
  await loadBook('q').then(() => {
    if (checkBadVolumeId()) {
      console.log('Success load bad length volumeId');
    } else {
      console.log('Fail load bad length volumeId');
    }
    $('#toast').removeClass('show').text('');
  });
}

async function noVolume() { //Pass loadBook() volumeId that is just white space
  await loadBook().then(() => {
    if (checkBadVolumeId()) {
      console.log('Success load no volumeId');
    } else {
      console.log('Fail load no volumeId');
    }
    $('#toast').removeClass('show').text('');
  });
}

async function whiteSpaceVolume() { //Pass loadBook() volumeId that is just white space
  await loadBook('       ').then(() => {
    if (checkBadVolumeId()) {
      console.log('Success load white space volumeId');
    } else {
      console.log('Fail load white space volumeId');
    }
    $('#toast').removeClass('show').text('');
  });
}

function checkBadVolumeId() { //3 of the bad volumeId functions have the same check
  return $('#toast').text() == 'Bad Book Id!';
}

function resetVolume() {
  $('#bookTitle').empty();
  $('#author').empty();
  $('#moreInfo').empty();
  $('#moreInfo').attr('href', '');
  $('#publisher').empty();
  $('#bookDescription').empty();
  $('#bookImage').attr('src', '');
}
