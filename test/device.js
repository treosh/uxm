import test from 'ava'
import userAgents from './fixtures/user-agents.json'
import { getDeviceType } from '../src'

const uaIgnore = [
  'Mozilla/5.0 (Linux; U; Android-4.0.3; en-us; Xoom Build/IML77) AppleWebKit/535.7 (KHTML, like Gecko) CrMo/16.0.912.75 Safari/535.7',
  'Mozilla/5.0 (Linux; U; Android 2.3.1; en-us; MID Build/GINGERBREAD) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',
  'Mozilla/5.0 (PlayBook; U; RIM Tablet OS 2.1.0; en-US) AppleWebKit/536.2+ (KHTML, like Gecko) Version/7.2.1.0 Safari/536.2+',
  'Mozilla/5.0 (Linux; U; Android 2.2; en-gb; GT-P1000 Build/FROYO) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',
  'Mozilla/5.0 (hp-tablet; Linux; hpwOS/3.0.5; U; en-US) AppleWebKit/534.6 (KHTML, like Gecko) wOSBrowser/234.83 Safari/534.6 TouchPad/1.0',
  /gsa-crawler/,
  'UCWEB/2.0 (Java; U; MIDP-2.0; Nokia203/20.37) U2/1.0.0 UCBrowser/8.7.0.218 U2/1.0.0 Mobile',
  'Dorado WAP-Browser/1.0.0/powerplay/2',
  'SCH-U365/1.0 NetFront/3.0.22.2.23 (GUI) MMP/2.0',
  /vivo\s+\w+\s+Build/
]

Object.keys(userAgents).forEach(type => {
  const expectedType = type === 'computer' ? 'desktop' : type
  userAgents[type].forEach((device, index) => {
    if (uaIgnore.some(ua => !!device.ua.match(ua))) return
    test(`${type} user-agent ${index}`, t => {
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
