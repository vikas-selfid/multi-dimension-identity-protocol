const propertiesReader = require('properties-reader');
const path = require('path');

const { bmClient } = require('../utils/util');
const i18n = require('../../i18n');

const props = propertiesReader(
  path.join(`${__dirname}/../../bin/etc/local.conf`)
);

const p2p = exports;

/**
 * API to add subscription using a p2p transport
 * @returns {object}
 */
p2p.addSubs = async (req, res) => {
  try {
    console.log('[p2p][addSubs] req.body', req.body);
    const { address, transport } = req.body;
    if (!address || !transport || (transport && transport !== 'bm')) {
      return res
        .status(400)
        .send({ result: null, error: i18n('Invalid parameters') });
    }
    console.log('[p2p][addSubs] II');
    const { error, result } = await bmClient('addSubscription', [address]);
    console.log('[p2p][addSubs] II', error, result);
    if (error) {
      if (error.code === -32603) {
        return res.status(200).send({
          message: 'Address already subscribed',
          result: true,
        });
      }
      return res.status(400).send({
        error: JSON.stringify(error),
        message: 'Subscription error',
      });
    }
    return res.status(200).send({
      message: 'Subscription to address added successfully',
      result: true,
    });
  } catch (errorT) {
    console.log('[p2p][addSubs] error', errorT);
    if (errorT && errorT.message) {
      return res
        .status(500)
        .send({ error: JSON.stringify(error), message: 'Internal error' });
    }
    return res.status(500).send({ error: true, message: 'Internal error.' });
  }
};

/**
 * API to broadcast an enc payload using a p2p transport
 * @returns {object}
 */
p2p.broadcast = async (req, res) => {
  try {
    const { payload, transport } = req.body;
    if (!payload || !transport || (transport && transport !== 'bm')) {
      return res
        .status(400)
        .send({ result: null, error: i18n('Invalid parameters') });
    }
    const resp = await bmClient('disseminatePreEncryptedMsg', [
      payload,
      1000, // requiredAverageProofOfWorkNonceTrialsPerByte
      1000, // requiredPayloadLengthExtraBytes
    ]);
    console.log('[resp]', resp);
    return res.status(200).send({
      message: 'Message broadcasted successfully',
      result: { msgid: resp.result },
    });
  } catch (errorT) {
    console.log('[p2p][broadcast] error', errorT);
    if (errorT && errorT.message) {
      return res
        .status(500)
        .send({ error: JSON.stringify(error), message: 'Internal error' });
    }
    return res.status(500).send({ error: true, message: 'Internal error.' });
  }
};

/**
 * API to fetch Broadcasts
 * @returns {object}
 */
p2p.fetchBroadcasts = async (req, res) => {
  try {
    const { broadcasterAddress, transport } = req.body;
    if (
      !broadcasterAddress ||
      !transport ||
      (transport && transport !== 'bm')
    ) {
      return res
        .status(400)
        .send({ result: null, error: i18n('Invalid parameters') });
    }
    const resp = await bmClient('getInboxMessagesByReceiver', [
      '[Broadcast subscribers]',
    ]);
    console.log('[resp]', resp);
    resp.inboxMessages = resp.inboxMessages.map((msg) => {
      msg.message = Buffer.from(msg.message, 'base64').toString();
      msg.subject = Buffer.from(msg.subject, 'base64').toString();
    });
    return res.status(200).send({
      error: null,
      message: 'Txn sent successfully.',
      result: { inboxMessages: resp.inboxMessages },
    });
  } catch (errorT) {
    console.log('[p2p][fetchBroadcasts] error', errorT);
    if (errorT && errorT.message) {
      return res
        .status(500)
        .send({ error: JSON.stringify(error), message: 'Internal error' });
    }
    return res.status(500).send({ error: true, message: 'Internal error.' });
  }
};