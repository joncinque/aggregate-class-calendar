'use strict';

const CDP = require('chrome-remote-interface');
const fs = require('fs');
const verbose = false;
//const logger = require('./logger');

function sleep (milliseconds = 5000) {
  return new Promise(resolve => setTimeout(() => resolve(), milliseconds))
}

exports.dumpCourseTable = (providerName, studioId, extraString) =>
{
  const options = {
    host: 'localhost',
    port: 9222
  };
  return CDP(options, async (client) => {
      const {Page, DOM, Runtime} = client;
      try {
        logger.info('Starting studio id [' + studioId + ']')
        await Page.enable();
        await DOM.enable();
        await Runtime.enable();
        await Page.navigate({url: 'https://clients.mindbodyonline.com/classic/home?studioid='+studioId});
        await Page.loadEventFired();
        // Lots of pages get loaded, so give some extra time
        await sleep(5000);

        if (verbose) {
          const {data} = await Page.captureScreenshot();
          fs.writeFileSync('page0.png', Buffer.from(data, 'base64'));
        }

        let topNode = await DOM.getDocument();
        // See if a captcha got triggered
        let captchaNode = await DOM.querySelector({
          nodeId: topNode.root.nodeId,
          selector: '#funcaptcha'
        });
        if (captchaNode.nodeId !== 0) {
          client._notifier.emit('error');
          throw 'Captcha triggered';
        }

        // Check the table exists
        let tableViewNode = await DOM.querySelector({
          nodeId: topNode.root.nodeId,
          selector: '#tabTD7.tab-nosel'
        });
        let updatedTab = false;
        if (tableViewNode.nodeId !== 0) { // tab not selected
          updatedTab = true;
          const clickEvent = "document.querySelector('#tabA7').click();";
          await Runtime.evaluate({expression: clickEvent});
          await Page.loadEventFired();
          topNode = await DOM.getDocument();
          if (verbose) {
            const {data} = await Page.captureScreenshot();
            fs.writeFileSync('page1.png', Buffer.from(data, 'base64'));
          }
        }

        if (verbose) {
          logger.info('Change to class tab ['+updatedTab+']');
        }

        // Check the view
        let viewNode = await DOM.querySelector({
          nodeId: topNode.root.nodeId,
          selector: '#week-tog-c.date-tog-sel-c'
        });

        let updatedView = false;
        if (viewNode.nodeId === 0) { // not found
          updatedView = true;
          const clickEvent = "document.querySelector('#week-tog-c').click();";
          await Runtime.evaluate({expression: clickEvent});
          await Page.loadEventFired();
          topNode = await DOM.getDocument();
          if (verbose) {
            const {data} = await Page.captureScreenshot();
            fs.writeFileSync('page2.png', Buffer.from(data, 'base64'));
          }
        }
        if (verbose) {
          logger.info('Updated view mode ['+updatedView+']');
        }

        // Check the location
        let locationNode = await DOM.querySelector({
          nodeId: topNode.root.nodeId,
          selector: '#optLocation'
        });
        let updatedLocation = false;
        if (locationNode.nodeId !== 0) { // was found
          updatedLocation = true;
          const toggleEvent = "{var d = document.querySelector('#optLocation'); d.selectedIndex = 0; d.onchange();}";
          await Runtime.evaluate({expression: toggleEvent});
          await Page.loadEventFired();
          topNode = await DOM.getDocument();
          if (verbose) {
            const {data} = await Page.captureScreenshot();
            fs.writeFileSync('page3.png', Buffer.from(data, 'base64'));
          }
        }
        if (verbose) {
          logger.info('Updated location ['+updatedLocation+']');
        }

        //if (updatedLocation || updatedView || updatedTab) {
        //  await Runtime.evaluate({expression: "setTimeout(()=>{}, 5000);"});
        //}
        // Get the table
        let tableNode = await DOM.querySelector({
          nodeId: topNode.root.nodeId,
          selector: '.classSchedule-mainTable-loaded'
        });
        let tableHTML = await DOM.getOuterHTML({
          nodeId: tableNode.nodeId
        });
        fs.writeFileSync(Math.abs(studioId) + '.html', tableHTML.outerHTML);
        logger.info('Dumped table for studio [' + studioId +']');
        if (verbose) {
          const {data} = await Page.captureScreenshot();
          fs.writeFileSync('tablepage.png', Buffer.from(data, 'base64'));
        }
        await client.close();
        client._notifier.emit('finish-dumping', client, Math.abs(studioId) + '.html');
      } catch (err) {
        if (err) {
          logger.error(err);
        }
        await client.close();
      }
  }).on('error', (err) => {
    if (err) {
      logger.error(err);
    }
    logger.error('Problem with studio id [' + studioId + ']')
  });
}

if (require.main === module) {
  // Testing
  exports.dumpCourseTable('MBO', 1991, '');
}
