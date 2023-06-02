const {
  pp_getAllAccounts,
  pp_saveAdditionalLinks,
  pp_getAdditionalLinks,
  pp_saveAllAccounts,
  pp_isChrome,
} = require('./reference');

function onUpdated(tab) {
  console.log(`Updated tab: ${tab.id}`);
}

function onError(error) {
  console.log(`Error: ${error}`);
}

document.addEventListener('DOMContentLoaded', function () {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log('Send');
    chrome.tabs.sendMessage(tabs[0].id, 'popupcomms', (response) => {
      console.log(JSON.stringify(response));
      showSingleAccount(response.accountId);
    });
  });

  const accurl = document.getElementById('accurl');

  accurl.addEventListener('click', function (e) {
    if ((e.target as HTMLElement).classList.contains('page-choice-urls')) {
      const chosenPage = (e.target as HTMLElement).dataset.url;
      const updating = chrome.tabs.create({ url: chosenPage });
      updating.then(onUpdated, onError);
    }
  });
  updatePopupUrls();

  const urlForm = document.getElementById('url-form');

  urlForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const urlInput = document.getElementById('url-input');
    const titleInput = document.getElementById('title-input');

    const url = (urlInput as HTMLFormElement).value;
    const title = (titleInput as HTMLFormElement).value;

    pp_getAdditionalLinks().then((accountDetails) => {
      if (!accountDetails['urls']) {
        accountDetails['urls'] = [];
      }
      accountDetails['urls'].push({ url: url, title: title });
      pp_saveAdditionalLinks(accountDetails);
      updatePopupUrls();
      console.log('URL:', url);
      console.log('Title:', title);
      (urlInput as HTMLFormElement).value = '';
      (titleInput as HTMLFormElement).value = '';
    });
  });
});

const updatePopupUrls = () => {
  pp_getAdditionalLinks().then((accountDetails) => {
    const innerText = '';
    document.getElementById('accurl').innerHTML = '';
    if (accountDetails['urls']) {
      for (const i in accountDetails['urls']) {
        const elementAccountDiv = document.createElement('div');
        elementAccountDiv.style.display = 'flex';
        const elementAccountName = document.createElement('span');
        elementAccountName.classList.add('page-choice-urls');
        elementAccountName.innerText = accountDetails['urls'][i]['title'];
        elementAccountName.dataset.url = accountDetails['urls'][i]['url'];
        const elementRemoveAccountName = document.createElement('span');
        elementRemoveAccountName.classList.add('remove-url');
        elementRemoveAccountName.setAttribute('data-key', accountDetails['urls'][i]['title']);
        elementRemoveAccountName.innerText = 'X';
        elementRemoveAccountName.addEventListener('click', function (event) {
          const title = (event.target as HTMLElement).dataset.key;
          pp_getAdditionalLinks().then((data) => {
            const urls = data['urls'];
            const newUrls = urls.filter((item) => item.title !== title);
            data['urls'] = newUrls;
            pp_saveAdditionalLinks(data);
            updatePopupUrls();
          });
        });
        elementAccountDiv.appendChild(elementAccountName);
        elementAccountDiv.appendChild(elementRemoveAccountName);
        document.getElementById('accurl').appendChild(elementAccountDiv);
        toggleVisibility(false);
      }
    }
  });
};

const cogIcon = document.getElementById('awsso-footer');
const hiddenBox = document.getElementById('hiddenBox');
const settingsBlock = document.getElementById('settingsBlock');

hiddenBox.style.height = '0px';
settingsBlock.style.display = 'none';

cogIcon.addEventListener('click', function () {
  if (settingsBlock.style.display === 'none') {
    settingsBlock.style.display = 'block';
    toggleVisibility(true);
  } else {
    settingsBlock.style.display = 'none';
    toggleVisibility(false);
  }
});

function toggleVisibility(visibility: boolean) {
  const removeUrls = document.getElementsByClassName('remove-url');
  for (let i = 0; i < removeUrls.length; i++) {
    const removeUrl = removeUrls[i];
    if (visibility) {
      (removeUrl as HTMLElement).style.visibility = 'visible';
    } else {
      (removeUrl as HTMLElement).style.visibility = 'hidden';
    }
  }
}


const regionsContainer = document.getElementById('regionWarnings');

regionsContainer.addEventListener('click', (event) => {
  const target = event.target as HTMLSpanElement;
  const regionwarning = target.dataset.regionwarning;
  if (regionwarning) {
    toggleAnimation(target);
  }
});


function toggleAnimation(target: HTMLSpanElement): void {
  if (target.style.animation) {
    // Turn off animation
    target.style.animation = '';
  } else {
    // Turn on animation
    // target.style.color = '#fff';
    // target.style.padding = '10px';
    // target.style.display = 'inline-block';
    // target.style.borderRadius = '5px';
    target.style.animation = 'blinkingBackground 2s infinite';
  }
}

const showWarningRegions = (accountId) => {
  const container = document.getElementById('regionWarning');
  pp_getAllAccounts().then((jsonData) => {
    const account = jsonData[accountId];
    const regions = account.regions;
    container.innerHTML = '';
    for (const region of regions) {
      const regionItem = document.querySelector(`[data-testid="${region}"]`) as HTMLDivElement;

      regionItem.style.color = '#fff';
      regionItem.style.padding = '10px';
      regionItem.style.display = 'inline-block';
      regionItem.style.borderRadius = '5px';
      regionItem.style.animation = 'blinkingBackground 2s infinite';
    }
  });
};

const showSingleAccount = (accountId) => {
  const container = document.getElementById('accountColors');
  pp_getAllAccounts().then((jsonData) => {
    const account = jsonData[accountId];

    const textColor = document.getElementById('textColor') as HTMLFormElement;
    const backgroundColor = document.getElementById('backgroundColor') as HTMLFormElement;

    textColor.style.color = account.color;
    textColor.style.backgroundColor = account.color;
    textColor.value = account.color;

    if (account.backgroundColor) {
      backgroundColor.style.color = account.backgroundColor;
      backgroundColor.style.backgroundColor = account.backgroundColor;
      backgroundColor.value = account.backgroundColor;
    }
    textColor.addEventListener('change', function (event) {
      const selectedColor = (event.target as HTMLInputElement).value;
      const textColor = document.getElementById('textColor') as HTMLFormElement;
      const awsBannerAccountName = document.getElementById('awsBannerAccountName');
      pp_getAllAccounts().then((data) => {
        data[accountId].color = selectedColor;
        awsBannerAccountName.style.color = selectedColor;
        backgroundColor.style.color = selectedColor;
        textColor.style.color = selectedColor;
        pp_saveAllAccounts(data).finally((update) => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, `updateColour:${selectedColor}`, (response) => {
              return true;
            });
          });
        });
      });
    });

    backgroundColor.addEventListener('change', function (event) {
      const selectedColor = (event.target as HTMLInputElement).value;
      const awsBanner = document.getElementById('awsBanner');
      pp_getAllAccounts().then((data) => {
        data[accountId].color = selectedColor;
        backgroundColor.style.backgroundColor = selectedColor;
        textColor.style.backgroundColor = selectedColor;
        awsBanner.style.backgroundColor = selectedColor;
        pp_saveAllAccounts(data).finally((update) => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, `updateBackgroundColor:${selectedColor}`, (response) => {
              return true;
            });
          });
        });
      });
    });
  });
};
