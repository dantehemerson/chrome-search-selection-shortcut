// from: https://github.com/segmentio/is-url/blob/master/index.js
// TODO: check https://github.com/Juuso-H/hotkeys-for-search/blob/c024c860568b4370d06974d0883ffcff2516f8b0/background.js#L20-L29
const protocolAndDomainRE = /^(?:\w+:)?\/\/(\S+)$/;
const localhostDomainRE = /^localhost[\:?\d]*(?:[^\:?\d]\S*)?$/
const nonLocalhostDomainRE = /^[^\s\.]+\.\S{2,}$/;

export function isUrl(text){
  if (typeof text !== 'string') {
    return false;
  }

  if (isChromeUrl(text)) {
    return true;
  }

  var match = text.match(protocolAndDomainRE);
  if (!match) {
    return false;
  }

  var everythingAfterProtocol = match[1];
  if (!everythingAfterProtocol) {
    return false;
  }

  if (localhostDomainRE.test(everythingAfterProtocol) ||
      nonLocalhostDomainRE.test(everythingAfterProtocol)) {
    return true;
  }

  return false;
}

function isChromeUrl(url) {
  return url.startsWith("chrome://");
}
