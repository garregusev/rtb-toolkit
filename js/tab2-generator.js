// Tab 2: Bid Request Generator

function generateBidRequest() {
  try {
    const campaignJson = document.getElementById('generatorCampaignJson').value.trim();

    if (!campaignJson) {
      throw new Error('Please enter campaign data');
    }

    let campaign = JSON.parse(campaignJson);
    if (Array.isArray(campaign)) {
      campaign = campaign[0];
    }

    const bidRequest = buildBidRequestFromCampaign(campaign);

    const output = document.getElementById('generatedBidRequest');
    output.textContent = JSON.stringify(bidRequest, null, 2);

    showStatus('success', '✓ Bid request generated!');

  } catch (err) {
    console.error('Generation error:', err);
    showStatus('error', 'Error: ' + err.message);
    document.getElementById('generatedBidRequest').textContent =
      `Error: ${err.message}`;
  }
}

function buildBidRequestFromCampaign(campaign) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);

  // Base structure
  const bidRequest = {
    id: `test-${timestamp}-${random}`,
    imp: [],
    cur: [campaign.currency || 'USD'],
    at: 1,
    tmax: 120,
    test: parseBoolean(campaign.test_flag) ? 1 : 0,
    allimps: 0,
    bcat: [],
    badv: []
  };

  // Build impression
  const imp = buildImpression(campaign);
  bidRequest.imp.push(imp);

  // Build site or app
  const inventoryType = parsePgArray(campaign.inventory_type_allowlist);
  if (!inventoryType || inventoryType.length === 0 || inventoryType.includes('WEB')) {
    bidRequest.site = buildSite(campaign);
  } else if (inventoryType.includes('MOBILE_APP')) {
    bidRequest.app = buildApp(campaign);
  } else {
    // Default to site
    bidRequest.site = buildSite(campaign);
  }

  // Build device
  bidRequest.device = buildDevice(campaign);

  // Build user
  bidRequest.user = buildUser(campaign);

  // Build source (including schain)
  bidRequest.source = buildSource(campaign, timestamp);

  // Build regs (regulatory)
  bidRequest.regs = buildRegs(campaign);

  return bidRequest;
}

function buildImpression(campaign) {
  const imp = {
    id: "1",
    secure: 1,
    displaymanager: "test-tool",
    displaymanagerver: "1.0"
  };

  // Add tagid if available
  const adUnitIds = parsePgArray(campaign.ad_unit_id_allowlist);
  if (adUnitIds && adUnitIds.length > 0) {
    imp.tagid = adUnitIds[0];
  }

  // Build banner or video based on media_type
  const mediaType = campaign.media_type;

  if (mediaType === 'DISPLAY') {
    imp.banner = buildBanner(campaign);
  } else if (mediaType === 'VIDEO_INSTREAM') {
    imp.video = buildVideo(campaign, 1, 1); // placement=1, linearity=1
  } else if (mediaType === 'VIDEO_OUTSTREAM') {
    imp.video = buildVideo(campaign, 3, 2); // placement=3, linearity=2
  } else {
    // Default to banner
    imp.banner = buildBanner(campaign);
  }

  // Set bidfloor (5% of campaign price)
  if (campaign.price) {
    const price = parseFloat(campaign.price);
    imp.bidfloor = parseFloat((price * 0.05).toFixed(4));
    imp.bidfloorcur = campaign.currency || 'USD';
  }

  // Set interstitial
  const interstitial = parseBoolean(campaign.interstitial);
  imp.instl = interstitial ? 1 : 0;

  // Add PMP if deal exists
  if (campaign.deal_code) {
    imp.pmp = buildPmp(campaign);
  }

  return imp;
}

function buildBanner(campaign) {
  const banner = {
    id: "1",
    pos: 0,
    topframe: 1,
    expdir: [1, 2, 3, 4],
    btype: [],
    battr: []
  };

  if (campaign.width) {
    banner.w = parseInt(campaign.width);
  }

  if (campaign.height) {
    banner.h = parseInt(campaign.height);
  }

  // Add format array for multi-size support
  if (campaign.width && campaign.height) {
    banner.format = [{
      w: parseInt(campaign.width),
      h: parseInt(campaign.height)
    }];
  }

  // Add mime types if available, otherwise defaults
  const mimeTypes = parsePgArray(campaign.mime_types);
  if (mimeTypes && mimeTypes.length > 0) {
    banner.mimes = mimeTypes;
  } else {
    banner.mimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  }

  // Add API frameworks if available
  const apiFrameworks = parsePgArray(campaign.api_frameworks);
  if (apiFrameworks && apiFrameworks.length > 0) {
    banner.api = apiFrameworks.map(api => parseInt(api));
  }

  return banner;
}

function buildVideo(campaign, placement, linearity) {
  const video = {
    placement: placement,
    linearity: linearity,
    sequence: 1,
    startdelay: 0,
    minbitrate: 300,
    maxbitrate: 1500,
    boxingallowed: 1,
    delivery: [2],
    pos: 0,
    battr: []
  };

  if (campaign.width) {
    video.w = parseInt(campaign.width);
  }

  if (campaign.height) {
    video.h = parseInt(campaign.height);
  }

  // Duration
  if (campaign.duration) {
    const duration = parseInt(campaign.duration);
    video.minduration = duration;
    video.maxduration = duration;
  } else {
    video.minduration = 5;
    video.maxduration = 30;
  }

  // Skippable
  const skippable = parseBoolean(campaign.is_skippable);
  if (skippable !== null) {
    video.skip = skippable ? 1 : 0;
    if (skippable) {
      video.skipmin = 5;
      video.skipafter = 5;
    }
  }

  // Protocols
  const protocols = parsePgArray(campaign.protocols);
  if (protocols && protocols.length > 0) {
    video.protocols = protocols.map(p => parseInt(p));
  } else {
    video.protocols = [2, 3, 5, 6];
  }

  // Playback methods
  const playbackMethods = parsePgArray(campaign.playback_methods);
  if (playbackMethods && playbackMethods.length > 0) {
    video.playbackmethod = playbackMethods.map(pm => parseInt(pm));
  } else {
    video.playbackmethod = [1, 2];
  }

  // Mime types
  const mimeTypes = parsePgArray(campaign.mime_types);
  if (mimeTypes && mimeTypes.length > 0) {
    video.mimes = mimeTypes;
  } else {
    video.mimes = ["video/mp4", "video/webm", "application/javascript"];
  }

  // API frameworks
  const apiFrameworks = parsePgArray(campaign.api_frameworks);
  if (apiFrameworks && apiFrameworks.length > 0) {
    video.api = apiFrameworks.map(api => parseInt(api));
  }

  return video;
}

function buildSite(campaign) {
  const site = {
    mobile: 0,
    privacypolicy: 1
  };

  // Site ID
  const siteIds = parsePgArray(campaign.site_id_allowlist);
  if (siteIds && siteIds.length > 0) {
    site.id = siteIds[0];
  }

  // Domain
  const domains = parsePgArray(campaign.domain_allowlist);
  if (domains && domains.length > 0) {
    site.domain = domains[0];
    site.page = `https://${domains[0]}/page-${Math.floor(Math.random() * 1000)}`;
    site.ref = `https://${domains[0]}`;
  }

  // Site name
  const siteNames = parsePgArray(campaign.site_name_allowlist);
  if (siteNames && siteNames.length > 0) {
    site.name = siteNames[0];
  }

  // Publisher
  const publisherIds = parsePgArray(campaign.publisher_id_allowlist);
  const publisherNames = parsePgArray(campaign.publisher_name_allowlist);

  if (publisherIds || publisherNames) {
    site.publisher = {};
    if (publisherIds && publisherIds.length > 0) {
      site.publisher.id = publisherIds[0];
    }
    if (publisherNames && publisherNames.length > 0) {
      site.publisher.name = publisherNames[0];
    }
    // Add publisher domain
    if (domains && domains.length > 0) {
      site.publisher.domain = domains[0];
    }
  }

  // IAB categories
  const iabCategories = parsePgArray(campaign.iab_categories);
  if (iabCategories && iabCategories.length > 0) {
    site.cat = iabCategories;
    site.pagecat = iabCategories;
    site.sectioncat = iabCategories;
  }

  // Keywords
  site.keywords = 'news,sports';

  return site;
}

function buildApp(campaign) {
  const app = {
    ver: '1.0.0',
    paid: 0,
    privacypolicy: 1
  };

  // App ID
  const siteIds = parsePgArray(campaign.site_id_allowlist);
  if (siteIds && siteIds.length > 0) {
    app.id = siteIds[0];
  }

  // Bundle (use domain as bundle for apps)
  const domains = parsePgArray(campaign.domain_allowlist);
  if (domains && domains.length > 0) {
    app.bundle = domains[0];
    app.storeurl = `https://play.google.com/store/apps/details?id=${domains[0]}`;
    app.domain = domains[0];
  }

  // App name
  const siteNames = parsePgArray(campaign.site_name_allowlist);
  if (siteNames && siteNames.length > 0) {
    app.name = siteNames[0];
  }

  // Publisher
  const publisherIds = parsePgArray(campaign.publisher_id_allowlist);
  const publisherNames = parsePgArray(campaign.publisher_name_allowlist);

  if (publisherIds || publisherNames) {
    app.publisher = {};
    if (publisherIds && publisherIds.length > 0) {
      app.publisher.id = publisherIds[0];
    }
    if (publisherNames && publisherNames.length > 0) {
      app.publisher.name = publisherNames[0];
    }
    // Add publisher domain
    if (domains && domains.length > 0) {
      app.publisher.domain = domains[0];
    }
  }

  // IAB categories
  const iabCategories = parsePgArray(campaign.iab_categories);
  if (iabCategories && iabCategories.length > 0) {
    app.cat = iabCategories;
    app.pagecat = iabCategories;
    app.sectioncat = iabCategories;
  }

  // Keywords
  app.keywords = 'gaming,entertainment';

  return app;
}

function buildDevice(campaign) {
  const device = {
    ip: "192.168.1.100",
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    dnt: 0,
    lmt: 0,
    w: 1920,
    h: 1080,
    pxratio: 1.0,
    js: 1,
    hwv: "1.0",
    ifa: "6D92078A-8246-4BA4-AE5B-76104861E7DC"
  };

  // OS - parse lquery pattern (e.g., "{Android.*}" -> "Android")
  const os = parseLquery(campaign.os_allowlist);
  if (os) {
    device.os = os;
    device.osv = "10.0";
  }

  // Device type - convert string names to OpenRTB integers
  const deviceTypes = parsePgArray(campaign.device_type_allowlist);
  if (deviceTypes && deviceTypes.length > 0) {
    // Try to convert if it's a string name like "Phone" or "Tablet"
    const deviceTypeInt = parseInt(deviceTypes[0]);
    if (!isNaN(deviceTypeInt)) {
      device.devicetype = deviceTypeInt;
    } else {
      const converted = convertDeviceType(deviceTypes[0]);
      if (converted) {
        device.devicetype = converted;
      }
    }
  }

  // Default to PC if not set
  if (!device.devicetype) {
    device.devicetype = 2;
  }

  // Language
  const languages = parsePgArray(campaign.browser_language_allowlist);
  if (languages && languages.length > 0) {
    device.language = languages[0];
  }

  // Connection type
  const connectionTypes = parsePgArray(campaign.connection_type_allowlist);
  if (connectionTypes && connectionTypes.length > 0) {
    device.connectiontype = parseInt(connectionTypes[0]);
  }

  // ISP
  const isps = parsePgArray(campaign.isp_allowlist);
  if (isps && isps.length > 0) {
    device.isp = isps[0];
  }

  // Device make/model - parse lquery pattern
  const devicePattern = parseLquery(campaign.device_allowlist);
  if (devicePattern) {
    const deviceParts = devicePattern.split(' ');
    device.make = deviceParts[0];
    if (deviceParts.length > 1) {
      device.model = deviceParts.slice(1).join(' ');
    }
  }

  // Geo
  device.geo = buildGeo(campaign);

  return device;
}

function buildGeo(campaign) {
  const geo = {
    type: 2, // IP address location
    lat: 52.5200,
    lon: 13.4050
  };

  // Country - parse lquery pattern (e.g., "{DE.*.*}" -> "DE")
  const countryCode = parseLquery(campaign.geo_allowlist);
  if (countryCode) {
    geo.country = countryCode;

    // Set realistic city/region based on country
    if (countryCode === 'IT') {
      geo.lat = 45.4642;
      geo.lon = 9.1900;
      geo.city = 'Milan';
      geo.region = 'IT-25';
    } else if (countryCode === 'DE') {
      geo.lat = 52.5200;
      geo.lon = 13.4050;
      geo.city = 'Berlin';
      geo.region = 'DE-BE';
    } else if (countryCode === 'US') {
      geo.lat = 40.7128;
      geo.lon = -74.0060;
      geo.city = 'New York';
      geo.region = 'US-NY';
      geo.metro = '501';
    } else if (countryCode === 'GB') {
      geo.lat = 51.5074;
      geo.lon = -0.1278;
      geo.city = 'London';
      geo.region = 'GB-ENG';
    } else if (countryCode === 'FR') {
      geo.lat = 48.8566;
      geo.lon = 2.3522;
      geo.city = 'Paris';
      geo.region = 'FR-IDF';
    } else {
      geo.city = 'Unknown';
    }
  } else {
    // Default to Berlin
    geo.country = 'DE';
    geo.city = 'Berlin';
    geo.region = 'DE-BE';
  }

  // Postal code
  const postalCodes = parsePgArray(campaign.postal_code_allowlist);
  if (postalCodes && postalCodes.length > 0) {
    geo.zip = postalCodes[0];
  }

  // UTC offset (in minutes)
  geo.utcoffset = 60;

  return geo;
}

function buildPmp(campaign) {
  const pmp = {
    private_auction: 0,
    deals: []
  };

  const deal = {
    id: campaign.deal_code
  };

  if (campaign.deal_ask_price) {
    deal.bidfloor = parseFloat(campaign.deal_ask_price);
  }

  if (campaign.deal_currency) {
    deal.bidfloorcur = campaign.deal_currency;
  }

  // Auction type
  if (campaign.deal_auction_type) {
    if (campaign.deal_auction_type === 'FIRST_PRICE') {
      deal.at = 1;
    } else if (campaign.deal_auction_type === 'FIXED_PRICE') {
      deal.at = 3;
    }
  }

  pmp.deals.push(deal);

  return pmp;
}

function buildUser(campaign) {
  const user = {
    id: "227c754a-96a8-4275-9bcd-75b1fa1cf200",
    ext: {
      consent: "CQh4EjAQh4EjAAfTyBENCYFsAP_AAEPAAAigJqtR_G__bXlr-TL36btkeYxf99hr7sQxBgbJs24FyDvW7JwH32EyNAyatqYKmRIAuzRBIQFtHJjURUChCIgVrTDsYEGUgTNKJ-BkgHMRY2NYCFxvmYljWQCZ4up_Z1d5mT-t7dr-2dzyy5hnv3Y9PmQlUIidCYctHfn8ZBAACAAAUAAQAAEApAAAEAMKQQAQICkAggQAgoChQAgQIJqgAmGhUQRlgQCBAoCEECABQVhABQIAgAASBogIASBgQ5AwAXWEyAAAKAAYIAQAAgwABAAAJAAhEAEABAIAQIBAoAAAAAAAIAGBgADABYiAQAAgOgYhgQQCBYAJEZVBpgSgAJBAS2VCCQBAgrhAkGGAAQIiYCAAAEAAoAAAAAAAAEAAAAAAAoAAAAAAAAAAAACAAAAQAgoCBAAAQIAA.IJqtR_G__bXlr-TL36btkeYxf99hr7sQxBgbJs24FyDvW7JwH32EyNAyatqYKmRIAuzRBIQFtHJjURUChCIgVrTDsYEGUgTNKJ-BkgHMRY2NYCFxvmYljWQCZ4up_Z1d5mT-t7dr-2dzyy5hnv3Y9PmQlUIidCYctHfn8ZBAACAAAUAAQAAEApAAAEAMKQQAQICkAggQAgoChQAgQIA",
      google_consent: []
    }
  };

  return user;
}

function buildSource(campaign, timestamp) {
  const supplySource = parsePgArray(campaign.supply_source_allowlist);

  const source = {
    fd: 1,
    tid: `${timestamp}-${Math.floor(Math.random() * 100000)}`,
    ext: {}
  };

  // Add supply_source to ext if available
  if (supplySource && supplySource.length > 0) {
    source.ext.supply_source = supplySource[0];
  }

  // Add supply chain (schain)
  source.ext.schain = {
    complete: 1,
    ver: "1.0",
    nodes: [
      {
        asi: "example-ssp.com",
        sid: "00001",
        hp: 1,
        rid: source.tid
      }
    ]
  };

  return source;
}

function buildRegs(campaign) {
  const regs = {
    coppa: 0,
    ext: {
      gdpr: 1,
      consent: "CQh4EjAQh4EjAAfTyBENCYFsAP_AAEPAAAigJqtR_G__bXlr-TL36btkeYxf99hr7sQxBgbJs24FyDvW7JwH32EyNAyatqYKmRIAuzRBIQFtHJjURUChCIgVrTDsYEGUgTNKJ-BkgHMRY2NYCFxvmYljWQCZ4up_Z1d5mT-t7dr-2dzyy5hnv3Y9PmQlUIidCYctHfn8ZBAACAAAUAAQAAEApAAAEAMKQQAQICkAggQAgoChQAgQIJqgAmGhUQRlgQCBAoCEECABQVhABQIAgAASBogIASBgQ5AwAXWEyAAAKAAYIAQAAgwABAAAJAAhEAEABAIAQIBAoAAAAAAAIAGBgADABYiAQAAgOgYhgQQCBYAJEZVBpgSgAJBAS2VCCQBAgrhAkGGAAQIiYCAAAEAAoAAAAAAAAEAAAAAAAoAAAAAAAAAAAACAAAAQAgoCBAAAQIAA.IJqtR_G__bXlr-TL36btkeYxf99hr7sQxBgbJs24FyDvW7JwH32EyNAyatqYKmRIAuzRBIQFtHJjURUChCIgVrTDsYEGUgTNKJ-BkgHMRY2NYCFxvmYljWQCZ4up_Z1d5mT-t7dr-2dzyy5hnv3Y9PmQlUIidCYctHfn8ZBAACAAAUAAQAAEApAAAEAMKQQAQICkAggQAgoChQAgQIA",
      us_privacy: "1---"
    }
  };

  return regs;
}

function clearGeneratorInputs() {
  if (confirm('Are you sure you want to clear all inputs?')) {
    document.getElementById('generatorCampaignJson').value = '';
    document.getElementById('generatedBidRequest').textContent = '-- Click "Generate Bid Request"';
    showStatus('info', 'Inputs cleared');
  }
}

function copyGeneratedBidRequest() {
  const bidRequest = document.getElementById('generatedBidRequest').textContent;

  if (!bidRequest || bidRequest.startsWith('--') || bidRequest.startsWith('Error:')) {
    showStatus('error', 'Nothing to copy. Generate a bid request first.');
    return;
  }

  copyToClipboard(bidRequest);
}

function loadGeneratorSample() {
  const sampleCampaign = [
    {
      "line_item_id": "100000318",
      "media_type": "DISPLAY",
      "width": "320",
      "height": "480",
      "price": "2",
      "price_type": "CPM",
      "currency": "EUR",
      "interstitial": "false",
      "start_date": "2025-11-13T03:00:00Z",
      "end_date": "2025-11-25T20:59:00Z",
      "postal_code_allowlist": "{26100,36022,40017}",
      "inventory_type_allowlist": "{WEB}",
      "domain_allowlist": "{3bmeteo.com,adnkronos.com,ansa.it}",
      "supply_source_allowlist": "{Equativ,VIS.X}",
      "domain_blocklist": "{\"null\"}"
    }
  ];

  document.getElementById('generatorCampaignJson').value = JSON.stringify(sampleCampaign, null, 2);

  showStatus('success', '✓ Sample campaign loaded!');
}
