// Tab 1: Bid Request Validator

function validateBidRequest() {
  try {
    // Get inputs
    const campaignJson = document.getElementById('campaignJson').value.trim();
    const bidRequestJson = document.getElementById('bidRequestJson').value.trim();
    
    if (!campaignJson) {
      throw new Error('Please enter campaign data');
    }
    
    if (!bidRequestJson) {
      throw new Error('Please enter bid request data');
    }
    
    // Parse JSONs - handle both array and object format
    let campaign = JSON.parse(campaignJson);
    if (Array.isArray(campaign)) {
      campaign = campaign[0]; // Take first element if array
    }
    
    const bidRequest = JSON.parse(bidRequestJson);
    
    // Validate structure
    if (!bidRequest.imp || !Array.isArray(bidRequest.imp) || bidRequest.imp.length === 0) {
      throw new Error('Bid request must contain at least one impression');
    }
    
    // Run validation
    const results = performValidation(campaign, bidRequest);
    
    // Sort results: failed first, then passed, then N/A
    results.sort((a, b) => {
      if (a.match === false && b.match !== false) return -1;
      if (a.match !== false && b.match === false) return 1;
      if (a.match === true && b.match === null) return -1;
      if (a.match === null && b.match === true) return 1;
      return 0;
    });
    
    // Display results
    displayValidationResults(results);
    
    showStatus('success', '✓ Validation completed!');
    
  } catch (err) {
    console.error('Validation error:', err);
    showStatus('error', 'Error: ' + err.message);
    document.getElementById('validationResults').innerHTML = 
      `<div class="status error">Error: ${err.message}</div>`;
  }
}

function performValidation(campaign, bidRequest) {
  const results = [];
  
  // Always add all validations - they return objects even if no campaign value
  results.push(validateTestFlag(campaign, bidRequest));
  results.push(validateMediaType(campaign, bidRequest));
  results.push(validateWidth(campaign, bidRequest));
  results.push(validateHeight(campaign, bidRequest));
  results.push(validateInterstitial(campaign, bidRequest));
  results.push(validatePrice(campaign, bidRequest));
  results.push(validateCurrency(campaign, bidRequest));
  results.push(validateDateRange(campaign, bidRequest));
  results.push(validateDomain(campaign, bidRequest));
  results.push(validateInventoryType(campaign, bidRequest));
  results.push(validateSupplySource(campaign, bidRequest));
  results.push(validatePostalCode(campaign, bidRequest));
  results.push(validateIabCategories(campaign, bidRequest));
  results.push(validateSiteId(campaign, bidRequest));
  results.push(validateSiteName(campaign, bidRequest));
  results.push(validatePublisherId(campaign, bidRequest));
  results.push(validatePublisherName(campaign, bidRequest));
  results.push(validateAdUnitId(campaign, bidRequest));
  results.push(validateOS(campaign, bidRequest));
  results.push(validateBrowser(campaign, bidRequest));
  results.push(validateDevice(campaign, bidRequest));
  results.push(validateDeviceType(campaign, bidRequest));
  results.push(validateConnectionType(campaign, bidRequest));
  results.push(validateLanguage(campaign, bidRequest));
  results.push(validateGeo(campaign, bidRequest));
  results.push(validateISP(campaign, bidRequest));
  results.push(validateIP(campaign, bidRequest));
  results.push(validateDeliverySchedule(campaign, bidRequest));
  results.push(validateDeal(campaign, bidRequest));
  results.push(validateMimeTypes(campaign, bidRequest));
  results.push(validateApiFrameworks(campaign, bidRequest));
  results.push(validateProtocols(campaign, bidRequest));
  results.push(validatePlaybackMethods(campaign, bidRequest));
  results.push(validateDuration(campaign, bidRequest));
  results.push(validateSkippable(campaign, bidRequest));
  results.push(validateAdUnitRatio(campaign, bidRequest));
  
  return results;
}

// Individual validation functions

function validateTestFlag(campaign, bidRequest) {
  const campaignTestFlag = parseBoolean(campaign.test_flag);
  const bidRequestTest = bidRequest.test;

  if (campaignTestFlag === null) {
    return {
      field: 'test_flag',
      campaignValue: 'not set',
      bidRequestValue: bidRequestTest !== undefined ? bidRequestTest : 'not specified',
      match: null
    };
  }

  const expectedTest = campaignTestFlag ? 1 : 0;
  const match = bidRequestTest === expectedTest;

  return {
    field: 'test_flag',
    campaignValue: campaignTestFlag,
    bidRequestValue: bidRequestTest !== undefined ? bidRequestTest : 'not specified',
    match: bidRequestTest !== undefined ? match : null
  };
}

function validateMediaType(campaign, bidRequest) {
  const campaignMediaType = campaign.media_type;
  const hasDisplay = bidRequest.imp.some(imp => imp.banner);
  const hasVideo = bidRequest.imp.some(imp => imp.video);
  
  let bidRequestMediaType = null;
  if (hasDisplay) bidRequestMediaType = 'DISPLAY';
  if (hasVideo) {
    const placement = bidRequest.imp.find(imp => imp.video)?.video?.placement;
    bidRequestMediaType = placement === 1 ? 'VIDEO_INSTREAM' : 'VIDEO_OUTSTREAM';
  }
  
  const match = campaignMediaType === bidRequestMediaType;
  
  return {
    field: 'media_type',
    campaignValue: campaignMediaType || 'not set',
    bidRequestValue: bidRequestMediaType || 'not detected',
    match: campaignMediaType ? match : null
  };
}

function validateWidth(campaign, bidRequest) {
  const campaignWidth = parseInt(campaign.width);
  const bidRequestWidths = [];
  
  bidRequest.imp.forEach(imp => {
    if (imp.banner?.w) bidRequestWidths.push(imp.banner.w);
    if (imp.video?.w) bidRequestWidths.push(imp.video.w);
  });
  
  if (!campaignWidth) {
    return {
      field: 'width',
      campaignValue: 'not set',
      bidRequestValue: bidRequestWidths.length > 0 ? bidRequestWidths.join(', ') : 'not specified',
      match: null
    };
  }
  
  const match = bidRequestWidths.includes(campaignWidth);
  
  return {
    field: 'width',
    campaignValue: campaignWidth,
    bidRequestValue: bidRequestWidths.length > 0 ? bidRequestWidths.join(', ') : 'not specified',
    match: bidRequestWidths.length > 0 ? match : null
  };
}

function validateHeight(campaign, bidRequest) {
  const campaignHeight = parseInt(campaign.height);
  const bidRequestHeights = [];
  
  bidRequest.imp.forEach(imp => {
    if (imp.banner?.h) bidRequestHeights.push(imp.banner.h);
    if (imp.video?.h) bidRequestHeights.push(imp.video.h);
  });
  
  if (!campaignHeight) {
    return {
      field: 'height',
      campaignValue: 'not set',
      bidRequestValue: bidRequestHeights.length > 0 ? bidRequestHeights.join(', ') : 'not specified',
      match: null
    };
  }
  
  const match = bidRequestHeights.includes(campaignHeight);
  
  return {
    field: 'height',
    campaignValue: campaignHeight,
    bidRequestValue: bidRequestHeights.length > 0 ? bidRequestHeights.join(', ') : 'not specified',
    match: bidRequestHeights.length > 0 ? match : null
  };
}

function validateInterstitial(campaign, bidRequest) {
  const campaignInterstitial = parseBoolean(campaign.interstitial);
  const bidRequestInterstitial = bidRequest.imp.some(imp => imp.instl === 1);
  
  if (campaignInterstitial === null) {
    return {
      field: 'interstitial',
      campaignValue: 'not set',
      bidRequestValue: bidRequestInterstitial,
      match: null
    };
  }
  
  const match = campaignInterstitial === bidRequestInterstitial;
  
  return {
    field: 'interstitial',
    campaignValue: campaignInterstitial,
    bidRequestValue: bidRequestInterstitial,
    match: match
  };
}

function validatePrice(campaign, bidRequest) {
  const campaignPrice = parseFloat(campaign.price);
  const bidfloors = bidRequest.imp.map(imp => imp.bidfloor || 0);
  const maxBidfloor = Math.max(...bidfloors);
  
  if (!campaignPrice || isNaN(campaignPrice)) {
    return {
      field: 'price vs bidfloor',
      campaignValue: 'not set',
      bidRequestValue: maxBidfloor.toFixed(4),
      match: null
    };
  }
  
  const match = campaignPrice >= maxBidfloor;
  
  return {
    field: 'price vs bidfloor',
    campaignValue: campaignPrice.toFixed(2),
    bidRequestValue: maxBidfloor.toFixed(4),
    match: match
  };
}

function validateCurrency(campaign, bidRequest) {
  const campaignCurrency = campaign.currency;
  const bidRequestCurrency = bidRequest.cur?.[0] || 'USD';
  
  if (!campaignCurrency) {
    return {
      field: 'currency',
      campaignValue: 'not set',
      bidRequestValue: bidRequestCurrency,
      match: null
    };
  }
  
  const match = campaignCurrency === bidRequestCurrency;
  
  return {
    field: 'currency',
    campaignValue: campaignCurrency,
    bidRequestValue: bidRequestCurrency,
    match: match
  };
}

function validateDateRange(campaign, bidRequest) {
  try {
    if (!campaign.start_date || !campaign.end_date) {
      return {
        field: 'date_range',
        campaignValue: 'not set',
        bidRequestValue: new Date().toISOString().split('T')[0],
        match: null
      };
    }
    
    const now = new Date();
    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return {
        field: 'date_range',
        campaignValue: 'invalid date format',
        bidRequestValue: now.toISOString().split('T')[0],
        match: null
      };
    }
    
    const match = now >= startDate && now <= endDate;
    
    return {
      field: 'date_range',
      campaignValue: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      bidRequestValue: now.toISOString().split('T')[0],
      match: match
    };
  } catch (err) {
    return {
      field: 'date_range',
      campaignValue: 'error parsing dates',
      bidRequestValue: 'N/A',
      match: null
    };
  }
}

function validateDomain(campaign, bidRequest) {
  const allowlist = parsePgArray(campaign.domain_allowlist);
  const blocklist = parsePgArray(campaign.domain_blocklist);
  const domain = getNestedValue(bidRequest, 'site.domain') || getNestedValue(bidRequest, 'app.domain');
  
  if (!allowlist && !blocklist) {
    return {
      field: 'domain',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: domain || 'not specified',
      match: null
    };
  }
  
  if (!domain) {
    return {
      field: 'domain',
      campaignValue: allowlist ? `allow: ${formatArrayForDisplay(allowlist)}` : `block: ${formatArrayForDisplay(blocklist)}`,
      bidRequestValue: 'not specified',
      match: null
    };
  }
  
  let match = true;
  
  if (allowlist && allowlist.length > 0) {
    match = match && allowlist.includes(domain);
  }
  
  if (blocklist && blocklist.length > 0) {
    match = match && !blocklist.includes(domain) && domain !== 'null';
  }
  
  const campaignValueDisplay = allowlist && allowlist.length > 0 
    ? `allow: ${formatArrayForDisplay(allowlist)}`
    : `block: ${formatArrayForDisplay(blocklist)}`;
  
  return {
    field: 'domain',
    campaignValue: campaignValueDisplay,
    bidRequestValue: domain,
    match: match
  };
}

function validateInventoryType(campaign, bidRequest) {
  const allowlist = parsePgArray(campaign.inventory_type_allowlist);
  const blocklist = parsePgArray(campaign.inventory_type_blocklist);
  
  const inventoryType = bidRequest.site ? 'WEB' : (bidRequest.app ? 'MOBILE_APP' : 'UNKNOWN');
  
  if (!allowlist && !blocklist) {
    return {
      field: 'inventory_type',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: inventoryType,
      match: null
    };
  }
  
  let match = true;
  
  if (allowlist && allowlist.length > 0) {
    match = match && allowlist.includes(inventoryType);
  }
  
  if (blocklist && blocklist.length > 0) {
    match = match && !blocklist.includes(inventoryType);
  }
  
  const campaignValueDisplay = allowlist && allowlist.length > 0
    ? `allow: ${formatArrayForDisplay(allowlist)}`
    : `block: ${formatArrayForDisplay(blocklist)}`;
  
  return {
    field: 'inventory_type',
    campaignValue: campaignValueDisplay,
    bidRequestValue: inventoryType,
    match: match
  };
}

function validateSupplySource(campaign, bidRequest) {
  const allowlist = parsePgArray(campaign.supply_source_allowlist);
  const blocklist = parsePgArray(campaign.supply_source_blocklist);
  const supplySource = getNestedValue(bidRequest, 'source.ext.supply_source');
  
  if (!allowlist && !blocklist) {
    return {
      field: 'supply_source',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: supplySource || 'not specified',
      match: null
    };
  }
  
  if (!supplySource) {
    return {
      field: 'supply_source',
      campaignValue: allowlist && allowlist.length > 0
        ? `allow: ${formatArrayForDisplay(allowlist)}`
        : `block: ${formatArrayForDisplay(blocklist)}`,
      bidRequestValue: 'not specified',
      match: null
    };
  }
  
  let match = true;
  
  if (allowlist && allowlist.length > 0) {
    match = match && allowlist.includes(supplySource);
  }
  
  if (blocklist && blocklist.length > 0) {
    match = match && !blocklist.includes(supplySource);
  }
  
  const campaignValueDisplay = allowlist && allowlist.length > 0
    ? `allow: ${formatArrayForDisplay(allowlist)}`
    : `block: ${formatArrayForDisplay(blocklist)}`;
  
  return {
    field: 'supply_source',
    campaignValue: campaignValueDisplay,
    bidRequestValue: supplySource,
    match: match
  };
}

function validatePostalCode(campaign, bidRequest) {
  const allowlist = parsePgArray(campaign.postal_code_allowlist);
  const blocklist = parsePgArray(campaign.postal_code_blocklist);
  const postalCode = getNestedValue(bidRequest, 'device.geo.zip');
  
  if (!allowlist && !blocklist) {
    return {
      field: 'postal_code',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: postalCode || 'not specified',
      match: null
    };
  }
  
  if (!postalCode) {
    return {
      field: 'postal_code',
      campaignValue: allowlist && allowlist.length > 0
        ? `allow: ${formatArrayForDisplay(allowlist)}`
        : `block: ${formatArrayForDisplay(blocklist)}`,
      bidRequestValue: 'not specified',
      match: null
    };
  }
  
  let match = true;
  
  if (allowlist && allowlist.length > 0) {
    match = match && allowlist.includes(postalCode);
  }
  
  if (blocklist && blocklist.length > 0) {
    match = match && !blocklist.includes(postalCode);
  }
  
  const campaignValueDisplay = allowlist && allowlist.length > 0
    ? `allow: ${formatArrayForDisplay(allowlist)}`
    : `block: ${formatArrayForDisplay(blocklist)}`;
  
  return {
    field: 'postal_code',
    campaignValue: campaignValueDisplay,
    bidRequestValue: postalCode,
    match: match
  };
}

function validateIabCategories(campaign, bidRequest) {
  const campaignCats = parsePgArray(campaign.iab_categories);
  const bidRequestCats = getNestedValue(bidRequest, 'site.cat') || getNestedValue(bidRequest, 'app.cat') || [];
  
  if (!campaignCats || campaignCats.length === 0) {
    return {
      field: 'iab_categories',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: bidRequestCats.length > 0 ? formatArrayForDisplay(bidRequestCats) : 'not specified',
      match: null
    };
  }
  
  if (bidRequestCats.length === 0) {
    return {
      field: 'iab_categories',
      campaignValue: formatArrayForDisplay(campaignCats),
      bidRequestValue: 'not specified',
      match: null
    };
  }
  
  const match = campaignCats.some(cat => bidRequestCats.includes(cat));
  
  return {
    field: 'iab_categories',
    campaignValue: formatArrayForDisplay(campaignCats),
    bidRequestValue: formatArrayForDisplay(bidRequestCats),
    match: match
  };
}

function validateSiteId(campaign, bidRequest) {
  const allowlist = parsePgArray(campaign.site_id_allowlist);
  const blocklist = parsePgArray(campaign.site_id_blocklist);
  
  const siteId = getNestedValue(bidRequest, 'site.id') || getNestedValue(bidRequest, 'app.id');
  
  if (!allowlist && !blocklist) {
    return {
      field: 'site_id',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: siteId || 'not specified',
      match: null
    };
  }
  
  if (!siteId) {
    return {
      field: 'site_id',
      campaignValue: allowlist && allowlist.length > 0
        ? `allow: ${formatArrayForDisplay(allowlist)}`
        : `block: ${formatArrayForDisplay(blocklist)}`,
      bidRequestValue: 'not specified',
      match: null
    };
  }
  
  let match = true;
  
  if (allowlist && allowlist.length > 0) {
    match = match && allowlist.includes(siteId.toString());
  }
  
  if (blocklist && blocklist.length > 0) {
    match = match && !blocklist.includes(siteId.toString());
  }
  
  const campaignValueDisplay = allowlist && allowlist.length > 0
    ? `allow: ${formatArrayForDisplay(allowlist)}`
    : `block: ${formatArrayForDisplay(blocklist)}`;
  
  return {
    field: 'site_id',
    campaignValue: campaignValueDisplay,
    bidRequestValue: siteId,
    match: match
  };
}

function validateSiteName(campaign, bidRequest) {
  const allowlist = parsePgArray(campaign.site_name_allowlist);
  const blocklist = parsePgArray(campaign.site_name_blocklist);
  
  const siteName = getNestedValue(bidRequest, 'site.name') || getNestedValue(bidRequest, 'app.name');
  
  if (!allowlist && !blocklist) {
    return {
      field: 'site_name',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: siteName || 'not specified',
      match: null
    };
  }
  
  if (!siteName) {
    return {
      field: 'site_name',
      campaignValue: allowlist && allowlist.length > 0
        ? `allow: ${formatArrayForDisplay(allowlist)}`
        : `block: ${formatArrayForDisplay(blocklist)}`,
      bidRequestValue: 'not specified',
      match: null
    };
  }
  
  let match = true;
  
  if (allowlist && allowlist.length > 0) {
    match = match && allowlist.includes(siteName);
  }
  
  if (blocklist && blocklist.length > 0) {
    match = match && !blocklist.includes(siteName);
  }
  
  const campaignValueDisplay = allowlist && allowlist.length > 0
    ? `allow: ${formatArrayForDisplay(allowlist)}`
    : `block: ${formatArrayForDisplay(blocklist)}`;
  
  return {
    field: 'site_name',
    campaignValue: campaignValueDisplay,
    bidRequestValue: siteName,
    match: match
  };
}

function validatePublisherId(campaign, bidRequest) {
  const allowlist = parsePgArray(campaign.publisher_id_allowlist);
  const blocklist = parsePgArray(campaign.publisher_id_blocklist);
  
  const publisherId = getNestedValue(bidRequest, 'site.publisher.id') || getNestedValue(bidRequest, 'app.publisher.id');
  
  if (!allowlist && !blocklist) {
    return {
      field: 'publisher_id',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: publisherId || 'not specified',
      match: null
    };
  }
  
  if (!publisherId) {
    return {
      field: 'publisher_id',
      campaignValue: allowlist && allowlist.length > 0
        ? `allow: ${formatArrayForDisplay(allowlist)}`
        : `block: ${formatArrayForDisplay(blocklist)}`,
      bidRequestValue: 'not specified',
      match: null
    };
  }
  
  let match = true;
  
  if (allowlist && allowlist.length > 0) {
    match = match && allowlist.includes(publisherId.toString());
  }
  
  if (blocklist && blocklist.length > 0) {
    match = match && !blocklist.includes(publisherId.toString());
  }
  
  const campaignValueDisplay = allowlist && allowlist.length > 0
    ? `allow: ${formatArrayForDisplay(allowlist)}`
    : `block: ${formatArrayForDisplay(blocklist)}`;
  
  return {
    field: 'publisher_id',
    campaignValue: campaignValueDisplay,
    bidRequestValue: publisherId,
    match: match
  };
}

function validatePublisherName(campaign, bidRequest) {
  const allowlist = parsePgArray(campaign.publisher_name_allowlist);
  const blocklist = parsePgArray(campaign.publisher_name_blocklist);
  
  const publisherName = getNestedValue(bidRequest, 'site.publisher.name') || getNestedValue(bidRequest, 'app.publisher.name');
  
  if (!allowlist && !blocklist) {
    return {
      field: 'publisher_name',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: publisherName || 'not specified',
      match: null
    };
  }
  
  if (!publisherName) {
    return {
      field: 'publisher_name',
      campaignValue: allowlist && allowlist.length > 0
        ? `allow: ${formatArrayForDisplay(allowlist)}`
        : `block: ${formatArrayForDisplay(blocklist)}`,
      bidRequestValue: 'not specified',
      match: null
    };
  }
  
  let match = true;
  
  if (allowlist && allowlist.length > 0) {
    match = match && allowlist.includes(publisherName);
  }
  
  if (blocklist && blocklist.length > 0) {
    match = match && !blocklist.includes(publisherName);
  }
  
  const campaignValueDisplay = allowlist && allowlist.length > 0
    ? `allow: ${formatArrayForDisplay(allowlist)}`
    : `block: ${formatArrayForDisplay(blocklist)}`;
  
  return {
    field: 'publisher_name',
    campaignValue: campaignValueDisplay,
    bidRequestValue: publisherName,
    match: match
  };
}

function validateAdUnitId(campaign, bidRequest) {
  const allowlist = parsePgArray(campaign.ad_unit_id_allowlist);
  const blocklist = parsePgArray(campaign.ad_unit_id_blocklist);
  
  const tagIds = bidRequest.imp.map(imp => imp.tagid).filter(Boolean);
  
  if (!allowlist && !blocklist) {
    return {
      field: 'ad_unit_id (tagid)',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: tagIds.length > 0 ? formatArrayForDisplay(tagIds) : 'not specified',
      match: null
    };
  }
  
  if (tagIds.length === 0) {
    return {
      field: 'ad_unit_id (tagid)',
      campaignValue: allowlist && allowlist.length > 0
        ? `allow: ${formatArrayForDisplay(allowlist)}`
        : `block: ${formatArrayForDisplay(blocklist)}`,
      bidRequestValue: 'not specified',
      match: null
    };
  }
  
  let match = false;
  
  tagIds.forEach(tagId => {
    let tagMatch = true;
    
    if (allowlist && allowlist.length > 0) {
      tagMatch = tagMatch && allowlist.includes(tagId.toString());
    }
    
    if (blocklist && blocklist.length > 0) {
      tagMatch = tagMatch && !blocklist.includes(tagId.toString());
    }
    
    if (tagMatch) match = true;
  });
  
  const campaignValueDisplay = allowlist && allowlist.length > 0
    ? `allow: ${formatArrayForDisplay(allowlist)}`
    : `block: ${formatArrayForDisplay(blocklist)}`;
  
  return {
    field: 'ad_unit_id (tagid)',
    campaignValue: campaignValueDisplay,
    bidRequestValue: formatArrayForDisplay(tagIds),
    match: match
  };
}

function validateOS(campaign, bidRequest) {
  const allowlist = parsePgArray(campaign.os_allowlist);
  const blocklist = parsePgArray(campaign.os_blocklist);
  
  const os = getNestedValue(bidRequest, 'device.os');
  
  if (!allowlist && !blocklist) {
    return {
      field: 'os',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: os || 'not specified',
      match: null
    };
  }
  
  if (!os) {
    return {
      field: 'os',
      campaignValue: allowlist && allowlist.length > 0
        ? `allow: ${formatArrayForDisplay(allowlist)}`
        : `block: ${formatArrayForDisplay(blocklist)}`,
      bidRequestValue: 'not specified',
      match: null
    };
  }
  
  let match = true;

  if (allowlist && allowlist.length > 0) {
    match = match && allowlist.some(pattern =>
      os.toLowerCase().startsWith(pattern.toLowerCase()) ||
      pattern.toLowerCase().startsWith(os.toLowerCase())
    );
  }

  if (blocklist && blocklist.length > 0) {
    match = match && !blocklist.some(pattern =>
      os.toLowerCase().startsWith(pattern.toLowerCase()) ||
      pattern.toLowerCase().startsWith(os.toLowerCase())
    );
  }
  
  const campaignValueDisplay = allowlist && allowlist.length > 0
    ? `allow: ${formatArrayForDisplay(allowlist)}`
    : `block: ${formatArrayForDisplay(blocklist)}`;
  
  return {
    field: 'os',
    campaignValue: campaignValueDisplay,
    bidRequestValue: os,
    match: match
  };
}

function validateBrowser(campaign, bidRequest) {
  const allowlist = parsePgArray(campaign.browser_allowlist);
  const blocklist = parsePgArray(campaign.browser_blocklist);
  
  const ua = getNestedValue(bidRequest, 'device.ua');
  
  if (!allowlist && !blocklist) {
    return {
      field: 'browser (UA)',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: ua ? ua.substring(0, 60) + '...' : 'not specified',
      match: null
    };
  }
  
  if (!ua) {
    return {
      field: 'browser (UA)',
      campaignValue: allowlist && allowlist.length > 0
        ? `allow: ${allowlist.length} patterns`
        : `block: ${blocklist.length} patterns`,
      bidRequestValue: 'not specified',
      match: null
    };
  }
  
  let match = true;

  if (allowlist && allowlist.length > 0) {
    match = match && allowlist.some(pattern =>
      ua.toLowerCase().startsWith(pattern.toLowerCase()) ||
      pattern.toLowerCase().startsWith(ua.toLowerCase()) ||
      ua.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  if (blocklist && blocklist.length > 0) {
    match = match && !blocklist.some(pattern =>
      ua.toLowerCase().startsWith(pattern.toLowerCase()) ||
      pattern.toLowerCase().startsWith(ua.toLowerCase()) ||
      ua.toLowerCase().includes(pattern.toLowerCase())
    );
  }
  
  const campaignValueDisplay = allowlist && allowlist.length > 0
    ? `allow: ${allowlist.length} patterns`
    : `block: ${blocklist.length} patterns`;
  
  return {
    field: 'browser (UA)',
    campaignValue: campaignValueDisplay,
    bidRequestValue: ua.substring(0, 60) + '...',
    match: match
  };
}

function validateDevice(campaign, bidRequest) {
  const allowlist = parsePgArray(campaign.device_allowlist);
  const blocklist = parsePgArray(campaign.device_blocklist);
  
  const device = getNestedValue(bidRequest, 'device.make') || getNestedValue(bidRequest, 'device.model');
  
  if (!allowlist && !blocklist) {
    return {
      field: 'device (make/model)',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: device || 'not specified',
      match: null
    };
  }
  
  if (!device) {
    return {
      field: 'device (make/model)',
      campaignValue: allowlist && allowlist.length > 0
        ? `allow: ${formatArrayForDisplay(allowlist)}`
        : `block: ${formatArrayForDisplay(blocklist)}`,
      bidRequestValue: 'not specified',
      match: null
    };
  }
  
  let match = true;

  if (allowlist && allowlist.length > 0) {
    match = match && allowlist.some(pattern =>
      device.toLowerCase().startsWith(pattern.toLowerCase()) ||
      pattern.toLowerCase().startsWith(device.toLowerCase())
    );
  }

  if (blocklist && blocklist.length > 0) {
    match = match && !blocklist.some(pattern =>
      device.toLowerCase().startsWith(pattern.toLowerCase()) ||
      pattern.toLowerCase().startsWith(device.toLowerCase())
    );
  }
  
  const campaignValueDisplay = allowlist && allowlist.length > 0
    ? `allow: ${formatArrayForDisplay(allowlist)}`
    : `block: ${formatArrayForDisplay(blocklist)}`;
  
  return {
    field: 'device (make/model)',
    campaignValue: campaignValueDisplay,
    bidRequestValue: device,
    match: match
  };
}

function validateDeviceType(campaign, bidRequest) {
  const allowlist = parsePgArray(campaign.device_type_allowlist);
  const blocklist = parsePgArray(campaign.device_type_blocklist);

  const deviceType = getNestedValue(bidRequest, 'device.devicetype');

  if (!allowlist && !blocklist) {
    const deviceTypeName = deviceType !== undefined ? getDeviceTypeName(deviceType) : 'not specified';
    const displayValue = deviceType !== undefined ? `${deviceType} (${deviceTypeName})` : 'not specified';
    return {
      field: 'device_type',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: displayValue,
      match: null
    };
  }

  if (deviceType === undefined || deviceType === null) {
    return {
      field: 'device_type',
      campaignValue: allowlist && allowlist.length > 0
        ? `allow: ${formatArrayForDisplay(allowlist)}`
        : `block: ${formatArrayForDisplay(blocklist)}`,
      bidRequestValue: 'not specified',
      match: null
    };
  }

  // Convert device type code to name for comparison
  const deviceTypeName = getDeviceTypeName(deviceType);

  let match = true;

  if (allowlist && allowlist.length > 0) {
    // Check if allowlist contains either the numeric code or the name
    match = match && (
      allowlist.includes(deviceType.toString()) ||
      allowlist.includes(deviceTypeName) ||
      allowlist.some(item => convertDeviceType(item) === deviceType)
    );
  }

  if (blocklist && blocklist.length > 0) {
    // Check if blocklist contains either the numeric code or the name
    match = match && !(
      blocklist.includes(deviceType.toString()) ||
      blocklist.includes(deviceTypeName) ||
      blocklist.some(item => convertDeviceType(item) === deviceType)
    );
  }

  const campaignValueDisplay = allowlist && allowlist.length > 0
    ? `allow: ${formatArrayForDisplay(allowlist)}`
    : `block: ${formatArrayForDisplay(blocklist)}`;

  return {
    field: 'device_type',
    campaignValue: campaignValueDisplay,
    bidRequestValue: `${deviceType} (${deviceTypeName})`,
    match: match
  };
}

function validateConnectionType(campaign, bidRequest) {
  const allowlist = parsePgArray(campaign.connection_type_allowlist);
  const blocklist = parsePgArray(campaign.connection_type_blocklist);

  const connectionType = getNestedValue(bidRequest, 'device.connectiontype');

  if (!allowlist && !blocklist) {
    const connectionTypeName = connectionType !== undefined ? getConnectionTypeName(connectionType) : 'not specified';
    const displayValue = connectionType !== undefined ? `${connectionType} (${connectionTypeName})` : 'not specified';
    return {
      field: 'connection_type',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: displayValue,
      match: null
    };
  }

  if (connectionType === undefined || connectionType === null) {
    return {
      field: 'connection_type',
      campaignValue: allowlist && allowlist.length > 0
        ? `allow: ${formatArrayForDisplay(allowlist)}`
        : `block: ${formatArrayForDisplay(blocklist)}`,
      bidRequestValue: 'not specified',
      match: null
    };
  }

  const connectionTypeName = getConnectionTypeName(connectionType);

  let match = true;

  if (allowlist && allowlist.length > 0) {
    match = match && (
      allowlist.includes(connectionType.toString()) ||
      allowlist.includes(connectionTypeName)
    );
  }

  if (blocklist && blocklist.length > 0) {
    match = match && !(
      blocklist.includes(connectionType.toString()) ||
      blocklist.includes(connectionTypeName)
    );
  }

  const campaignValueDisplay = allowlist && allowlist.length > 0
    ? `allow: ${formatArrayForDisplay(allowlist)}`
    : `block: ${formatArrayForDisplay(blocklist)}`;

  return {
    field: 'connection_type',
    campaignValue: campaignValueDisplay,
    bidRequestValue: `${connectionType} (${connectionTypeName})`,
    match: match
  };
}

function validateLanguage(campaign, bidRequest) {
  const allowlist = parsePgArray(campaign.browser_language_allowlist);
  const blocklist = parsePgArray(campaign.browser_language_blocklist);
  
  const language = getNestedValue(bidRequest, 'device.language');
  
  if (!allowlist && !blocklist) {
    return {
      field: 'language',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: language || 'not specified',
      match: null
    };
  }
  
  if (!language) {
    return {
      field: 'language',
      campaignValue: allowlist && allowlist.length > 0
        ? `allow: ${formatArrayForDisplay(allowlist)}`
        : `block: ${formatArrayForDisplay(blocklist)}`,
      bidRequestValue: 'not specified',
      match: null
    };
  }
  
  let match = true;
  
  if (allowlist && allowlist.length > 0) {
    match = match && allowlist.includes(language);
  }
  
  if (blocklist && blocklist.length > 0) {
    match = match && !blocklist.includes(language);
  }
  
  const campaignValueDisplay = allowlist && allowlist.length > 0
    ? `allow: ${formatArrayForDisplay(allowlist)}`
    : `block: ${formatArrayForDisplay(blocklist)}`;
  
  return {
    field: 'language',
    campaignValue: campaignValueDisplay,
    bidRequestValue: language,
    match: match
  };
}

function validateGeo(campaign, bidRequest) {
  const allowlist = parsePgArray(campaign.geo_allowlist);
  const blocklist = parsePgArray(campaign.geo_blocklist);
  
  const country = getNestedValue(bidRequest, 'device.geo.country');
  
  if (!allowlist && !blocklist) {
    return {
      field: 'geo (country)',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: country || 'not specified',
      match: null
    };
  }
  
  if (!country) {
    return {
      field: 'geo (country)',
      campaignValue: allowlist && allowlist.length > 0
        ? `allow: ${formatArrayForDisplay(allowlist)}`
        : `block: ${formatArrayForDisplay(blocklist)}`,
      bidRequestValue: 'not specified',
      match: null
    };
  }
  
  let match = true;
  
  if (allowlist && allowlist.length > 0) {
    match = match && allowlist.some(pattern => 
      country.toLowerCase().startsWith(pattern.toLowerCase()) ||
      pattern.toLowerCase().startsWith(country.toLowerCase())
    );
  }
  
  if (blocklist && blocklist.length > 0) {
    match = match && !blocklist.some(pattern => 
      country.toLowerCase().startsWith(pattern.toLowerCase()) ||
      pattern.toLowerCase().startsWith(country.toLowerCase())
    );
  }
  
  const campaignValueDisplay = allowlist && allowlist.length > 0
    ? `allow: ${formatArrayForDisplay(allowlist)}`
    : `block: ${formatArrayForDisplay(blocklist)}`;
  
  return {
    field: 'geo (country)',
    campaignValue: campaignValueDisplay,
    bidRequestValue: country,
    match: match
  };
}

function validateISP(campaign, bidRequest) {
  const allowlist = parsePgArray(campaign.isp_allowlist);
  const blocklist = parsePgArray(campaign.isp_blocklist);
  
  const isp = getNestedValue(bidRequest, 'device.isp');
  
  if (!allowlist && !blocklist) {
    return {
      field: 'isp',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: isp || 'not specified',
      match: null
    };
  }
  
  if (!isp) {
    return {
      field: 'isp',
      campaignValue: allowlist && allowlist.length > 0
        ? `allow: ${formatArrayForDisplay(allowlist)}`
        : `block: ${formatArrayForDisplay(blocklist)}`,
      bidRequestValue: 'not specified',
      match: null
    };
  }
  
  let match = true;
  
  if (allowlist && allowlist.length > 0) {
    match = match && allowlist.includes(isp);
  }
  
  if (blocklist && blocklist.length > 0) {
    match = match && !blocklist.includes(isp);
  }
  
  const campaignValueDisplay = allowlist && allowlist.length > 0
    ? `allow: ${formatArrayForDisplay(allowlist)}`
    : `block: ${formatArrayForDisplay(blocklist)}`;
  
  return {
    field: 'isp',
    campaignValue: campaignValueDisplay,
    bidRequestValue: isp,
    match: match
  };
}

function validateIP(campaign, bidRequest) {
  const allowlist = campaign.ip_allowlist;
  const blocklist = campaign.ip_blocklist;
  
  const ip = getNestedValue(bidRequest, 'device.ip') || getNestedValue(bidRequest, 'device.ipv6');
  
  if (!allowlist && !blocklist) {
    return {
      field: 'ip_address',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: ip || 'not specified',
      match: null
    };
  }
  
  if (!ip) {
    return {
      field: 'ip_address',
      campaignValue: allowlist ? 'has allowlist' : 'has blocklist',
      bidRequestValue: 'not specified',
      match: null
    };
  }
  
  return {
    field: 'ip_address',
    campaignValue: allowlist ? 'has allowlist' : (blocklist ? 'has blocklist' : 'any'),
    bidRequestValue: ip,
    match: null
  };
}

function validateDeliverySchedule(campaign, bidRequest) {
  const allowlist = parsePgArray(campaign.delivery_schedule_allowlist);
  const blocklist = parsePgArray(campaign.delivery_schedule_blocklist);
  
  if (!allowlist && !blocklist) {
    return {
      field: 'delivery_schedule',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: 'current time',
      match: null
    };
  }
  
  const now = new Date();
  const currentDay = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][now.getDay()];
  const currentTime = now.toTimeString().split(' ')[0];
  
  const campaignValueDisplay = allowlist && allowlist.length > 0
    ? `allow: ${formatArrayForDisplay(allowlist)}`
    : `block: ${formatArrayForDisplay(blocklist)}`;
  
  return {
    field: 'delivery_schedule',
    campaignValue: campaignValueDisplay,
    bidRequestValue: `${currentDay} ${currentTime}`,
    match: null
  };
}

function validateDeal(campaign, bidRequest) {
  const dealCode = campaign.deal_code;
  
  const deals = [];
  bidRequest.imp.forEach(imp => {
    if (imp.pmp && imp.pmp.deals) {
      imp.pmp.deals.forEach(deal => {
        if (deal.id) deals.push(deal.id);
      });
    }
  });
  
  if (!dealCode) {
    return {
      field: 'deal_code',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: deals.length > 0 ? formatArrayForDisplay(deals) : 'no deals',
      match: null
    };
  }
  
  if (deals.length === 0) {
    return {
      field: 'deal_code',
      campaignValue: dealCode,
      bidRequestValue: 'no deals',
      match: false
    };
  }
  
  const match = deals.includes(dealCode);
  
  return {
    field: 'deal_code',
    campaignValue: dealCode,
    bidRequestValue: formatArrayForDisplay(deals),
    match: match
  };
}

function validateMimeTypes(campaign, bidRequest) {
  const campaignMimes = parsePgArray(campaign.mime_types);
  
  const bidRequestMimes = [];
  bidRequest.imp.forEach(imp => {
    if (imp.banner?.mimes) bidRequestMimes.push(...imp.banner.mimes);
    if (imp.video?.mimes) bidRequestMimes.push(...imp.video.mimes);
  });
  
  if (!campaignMimes || campaignMimes.length === 0) {
    return {
      field: 'mime_types',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: bidRequestMimes.length > 0 ? formatArrayForDisplay([...new Set(bidRequestMimes)]) : 'not specified',
      match: null
    };
  }
  
  if (bidRequestMimes.length === 0) {
    return {
      field: 'mime_types',
      campaignValue: formatArrayForDisplay(campaignMimes),
      bidRequestValue: 'not specified',
      match: null
    };
  }
  
  const match = campaignMimes.some(mime => bidRequestMimes.includes(mime));
  
  return {
    field: 'mime_types',
    campaignValue: formatArrayForDisplay(campaignMimes),
    bidRequestValue: formatArrayForDisplay([...new Set(bidRequestMimes)]),
    match: match
  };
}

function validateApiFrameworks(campaign, bidRequest) {
  const campaignApis = parsePgArray(campaign.api_frameworks);

  const bidRequestApis = [];
  bidRequest.imp.forEach(imp => {
    if (imp.banner?.api) bidRequestApis.push(...imp.banner.api);
    if (imp.video?.api) bidRequestApis.push(...imp.video.api);
  });

  if (!campaignApis || campaignApis.length === 0) {
    const displayValues = bidRequestApis.map(api => `${api} (${getApiFrameworkName(api)})`);
    return {
      field: 'api_frameworks',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: bidRequestApis.length > 0 ? formatArrayForDisplay(displayValues) : 'not specified',
      match: null
    };
  }

  if (bidRequestApis.length === 0) {
    return {
      field: 'api_frameworks',
      campaignValue: formatArrayForDisplay(campaignApis),
      bidRequestValue: 'not specified',
      match: null
    };
  }

  const match = campaignApis.some(api => bidRequestApis.includes(parseInt(api)));

  const displayValues = bidRequestApis.map(api => `${api} (${getApiFrameworkName(api)})`);

  return {
    field: 'api_frameworks',
    campaignValue: formatArrayForDisplay(campaignApis),
    bidRequestValue: formatArrayForDisplay(displayValues),
    match: match
  };
}

function validateProtocols(campaign, bidRequest) {
  const campaignProtocols = parsePgArray(campaign.protocols);

  const bidRequestProtocols = [];
  bidRequest.imp.forEach(imp => {
    if (imp.video?.protocols) bidRequestProtocols.push(...imp.video.protocols);
  });

  if (!campaignProtocols || campaignProtocols.length === 0) {
    const displayValues = bidRequestProtocols.map(proto => `${proto} (${getProtocolName(proto)})`);
    return {
      field: 'protocols (video)',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: bidRequestProtocols.length > 0 ? formatArrayForDisplay(displayValues) : 'not specified',
      match: null
    };
  }

  if (bidRequestProtocols.length === 0) {
    return {
      field: 'protocols (video)',
      campaignValue: formatArrayForDisplay(campaignProtocols),
      bidRequestValue: 'not specified',
      match: null
    };
  }

  const match = campaignProtocols.some(proto => bidRequestProtocols.includes(parseInt(proto)));

  const displayValues = bidRequestProtocols.map(proto => `${proto} (${getProtocolName(proto)})`);

  return {
    field: 'protocols (video)',
    campaignValue: formatArrayForDisplay(campaignProtocols),
    bidRequestValue: formatArrayForDisplay(displayValues),
    match: match
  };
}

function validatePlaybackMethods(campaign, bidRequest) {
  const campaignPlayback = parsePgArray(campaign.playback_methods);

  const bidRequestPlayback = [];
  bidRequest.imp.forEach(imp => {
    if (imp.video?.playbackmethod) bidRequestPlayback.push(...imp.video.playbackmethod);
  });

  if (!campaignPlayback || campaignPlayback.length === 0) {
    const displayValues = bidRequestPlayback.map(pm => `${pm} (${getPlaybackMethodName(pm)})`);
    return {
      field: 'playback_methods (video)',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: bidRequestPlayback.length > 0 ? formatArrayForDisplay(displayValues) : 'not specified',
      match: null
    };
  }

  if (bidRequestPlayback.length === 0) {
    return {
      field: 'playback_methods (video)',
      campaignValue: formatArrayForDisplay(campaignPlayback),
      bidRequestValue: 'not specified',
      match: null
    };
  }

  const match = campaignPlayback.some(pm => bidRequestPlayback.includes(parseInt(pm)));

  const displayValues = bidRequestPlayback.map(pm => `${pm} (${getPlaybackMethodName(pm)})`);

  return {
    field: 'playback_methods (video)',
    campaignValue: formatArrayForDisplay(campaignPlayback),
    bidRequestValue: formatArrayForDisplay(displayValues),
    match: match
  };
}

function validateDuration(campaign, bidRequest) {
  const campaignDuration = parseInt(campaign.duration);
  
  const durations = [];
  bidRequest.imp.forEach(imp => {
    if (imp.video?.minduration) durations.push(imp.video.minduration);
    if (imp.video?.maxduration) durations.push(imp.video.maxduration);
  });
  
  if (!campaignDuration) {
    return {
      field: 'duration (video)',
      campaignValue: 'not set',
      bidRequestValue: durations.length > 0 ? `${Math.min(...durations)}s - ${Math.max(...durations)}s` : 'not specified',
      match: null
    };
  }
  
  if (durations.length === 0) {
    return {
      field: 'duration (video)',
      campaignValue: `${campaignDuration}s`,
      bidRequestValue: 'not specified',
      match: null
    };
  }
  
  const minDur = Math.min(...durations);
  const maxDur = Math.max(...durations);
  const match = campaignDuration >= minDur && campaignDuration <= maxDur;
  
  return {
    field: 'duration (video)',
    campaignValue: `${campaignDuration}s`,
    bidRequestValue: `${minDur}s - ${maxDur}s`,
    match: match
  };
}

function validateSkippable(campaign, bidRequest) {
  const campaignSkippable = parseBoolean(campaign.is_skippable);
  
  const skippableValues = [];
  bidRequest.imp.forEach(imp => {
    if (imp.video?.skip !== undefined) {
      skippableValues.push(imp.video.skip === 1);
    }
  });
  
  if (campaignSkippable === null) {
    return {
      field: 'is_skippable (video)',
      campaignValue: 'not set',
      bidRequestValue: skippableValues.length > 0 ? skippableValues[0] : 'not specified',
      match: null
    };
  }
  
  if (skippableValues.length === 0) {
    return {
      field: 'is_skippable (video)',
      campaignValue: campaignSkippable,
      bidRequestValue: 'not specified',
      match: null
    };
  }
  
  const match = skippableValues.includes(campaignSkippable);
  
  return {
    field: 'is_skippable (video)',
    campaignValue: campaignSkippable,
    bidRequestValue: skippableValues[0],
    match: match
  };
}

function validateAdUnitRatio(campaign, bidRequest) {
  const ratioBlocklist = parsePgArray(campaign.ad_unit_ratio_blocklist);
  
  const ratios = [];
  bidRequest.imp.forEach(imp => {
    const w = imp.banner?.w || imp.video?.w;
    const h = imp.banner?.h || imp.video?.h;
    if (w && h) {
      ratios.push((w / h).toFixed(2));
    }
  });
  
  if (!ratioBlocklist || ratioBlocklist.length === 0) {
    return {
      field: 'ad_unit_ratio',
      campaignValue: 'not set (any allowed)',
      bidRequestValue: ratios.length > 0 ? formatArrayForDisplay(ratios) : 'not calculated',
      match: null
    };
  }
  
  if (ratios.length === 0) {
    return {
      field: 'ad_unit_ratio',
      campaignValue: `block: ${formatArrayForDisplay(ratioBlocklist)}`,
      bidRequestValue: 'not calculated',
      match: null
    };
  }
  
  const match = !ratios.some(ratio => ratioBlocklist.includes(ratio));
  
  return {
    field: 'ad_unit_ratio',
    campaignValue: `block: ${formatArrayForDisplay(ratioBlocklist)}`,
    bidRequestValue: formatArrayForDisplay(ratios),
    match: match
  };
}

function displayValidationResults(results) {
  const container = document.getElementById('validationResults');
  
  if (results.length === 0) {
    container.innerHTML = '<div class="status info">No validation rules to check</div>';
    return;
  }
  
  let html = '<div style="overflow-x: auto;"><table class="validation-table">';
  html += '<thead><tr>';
  html += '<th>Field</th>';
  html += '<th>Campaign Value</th>';
  html += '<th>Bid Request Value</th>';
  html += '<th>Match</th>';
  html += '</tr></thead><tbody>';
  
  results.forEach(result => {
    const matchClass = result.match === null ? 'match-na' : (result.match ? 'match-true' : 'match-false');
    const matchSymbol = result.match === null ? '—' : (result.match ? '✓' : '✗');
    
    html += '<tr>';
    html += `<td class="field-name">${result.field}</td>`;
    html += `<td class="field-value">${result.campaignValue || '—'}</td>`;
    html += `<td class="field-value">${result.bidRequestValue || '—'}</td>`;
    html += `<td class="match-status ${matchClass}">${matchSymbol}</td>`;
    html += '</tr>';
  });
  
  html += '</tbody></table></div>';
  
  // Add summary
  const totalChecks = results.length;
  const passed = results.filter(r => r.match === true).length;
  const failed = results.filter(r => r.match === false).length;
  const notApplicable = results.filter(r => r.match === null).length;
  
  html += `<div class="status info" style="margin-top: 16px;">
    <strong>Summary:</strong> ${passed} passed, ${failed} failed, ${notApplicable} N/A (out of ${totalChecks} total checks)
  </div>`;
  
  container.innerHTML = html;
}

function clearValidatorInputs() {
  if (confirm('Are you sure you want to clear all inputs?')) {
    document.getElementById('campaignJson').value = '';
    document.getElementById('bidRequestJson').value = '';
    document.getElementById('validationResults').innerHTML = '';
    showStatus('info', 'Inputs cleared');
  }
}

function loadValidatorSample() {
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
  
  const sampleBidRequest = {
    "id": "test-123",
    "cur": ["EUR"],
    "imp": [{
      "id": "1",
      "banner": {"w": 320, "h": 480},
      "bidfloor": 1.5,
      "instl": 0,
      "secure": 1
    }],
    "site": {
      "id": "123",
      "domain": "ansa.it",
      "publisher": {"id": "456"}
    },
    "device": {
      "os": "Android",
      "devicetype": 1,
      "language": "it",
      "geo": {"country": "IT", "zip": "26100"}
    },
    "source": {
      "ext": {"supply_source": "VIS.X"}
    }
  };
  
  document.getElementById('campaignJson').value = JSON.stringify(sampleCampaign, null, 2);
  document.getElementById('bidRequestJson').value = JSON.stringify(sampleBidRequest, null, 2);
  
  showStatus('success', '✓ Sample data loaded!');
}
