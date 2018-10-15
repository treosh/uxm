import test from 'ava'
import userAgents from './fixtures/user-agents.json'
import { getDeviceType } from '../src'

const uaIgnore = [
  'Mozilla/5.0 (Linux; U; Android-4.0.3; en-us; Xoom Build/IML77) AppleWebKit/535.7 (KHTML, like Gecko) CrMo/16.0.912.75 Safari/535.7',
  'Mozilla/5.0 (Linux; U; Android 4.0.4; pt-br; MZ608 Build/7.7.1-141-7-FLEM-UMTS-LA) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30',
  'gsa-crawler (Enterprise; T5-JJQHLGRCX9WKD; ssc-aps-notification-docubridge@hc-sc.gc.ca)',
  'Nokia6280/2.0 (03.60) Profile/MIDP-2.0 Configuration/CLDC-1.1',
  'UCWEB/2.0 (Java; U; MIDP-2.0; Nokia203/20.37) U2/1.0.0 UCBrowser/8.7.0.218 U2/1.0.0 Mobile',
  'Nokia205/2.0 (04.71) Profile/MIDP-2.1 Configuration/CLDC-1.1',
  'Dorado WAP-Browser/1.0.0/powerplay/2',
  'SCH-U365/1.0 NetFront/3.0.22.2.23 (GUI) MMP/2.0',
  'Mozilla/5.0 (Linux; Android 6.0; vivo 1713 Build/MRA58K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.124 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 5.1.1; vivo X7 Build/LMY47V; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/48.0.2564.116 Mobile Safari/537.36 baiduboxapp/8.6.5 (Baidu; P1 5.1.1)',
  'Mozilla/5.0 (Linux; Android 6.0.1; vivo 1603 Build/MMB29M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.83 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 6.0; vivo 1606 Build/MMB29M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.124 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 7.1; vivo 1716 Build/N2G47H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.98 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 6.0; vivo 1610 Build/MMB29M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.124 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 5.0.2; vivo Y51 Build/LRX22G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.124 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; U; Android 2.3.1; en-us; MID Build/GINGERBREAD) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',
  'Mozilla/5.0 (PlayBook; U; RIM Tablet OS 2.1.0; en-US) AppleWebKit/536.2+ (KHTML, like Gecko) Version/7.2.1.0 Safari/536.2+',
  'Mozilla/5.0 (Linux; U; Android 2.2; en-gb; GT-P1000 Build/FROYO) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'
]

test('user-agents', t => {
  Object.keys(userAgents).forEach(type => {
    const expectedType = type === 'computer' ? 'desktop' : type
    userAgents[type].forEach(device => {
      if (uaIgnore.includes(device.ua)) return
      const expectedDevice = {
        ...device,
        deviceType: expectedType
      }
      const testDevice = {
        ...device,
        deviceType: getDeviceType(device.ua)
      }
      t.deepEqual(
        testDevice,
        expectedDevice,
        `Expected type of ${expectedType}, but got ${testDevice.deviceType} instead.`
      )
    })
  })
})
