const Exchange = require('../exchange')
const WebSocket = require('ws')
const pako = require('pako')
const axios = require('axios')

class Okex extends Exchange {
  constructor(options) {
    super(options)

    this.id = 'okex'

    this.liquidatableProducts = []
    this.liquidatableProductsIndex = 0
    this.liquidatableProductsReferences = {}

    this.mapping = pair => {
      let id = this.pairs[pair] || this.pairs[pair.replace(/USDT/i, 'USD')]

      if (!id) {
        for (let name in this.pairs) {
          if (pair === this.pairs[name]) {
            id = this.pairs[name]
            break
          }
        }
      }

      if (id) {
        if (/\d+$/.test(id)) {
          this.type = 'futures'
        } else if (/\-SWAP$/.test(id)) {
          this.type = 'swap'
        } else {
          this.type = 'spot'
        }
      }

      return id || false
    }

    this.pairs = {
      BCHBTC: 'BCH-BTC',
      BSVBTC: 'BSV-BTC',
      DASHBTC: 'DASH-BTC',
      ADABTC: 'ADA-BTC',
      ABLBTC: 'ABL-BTC',
      AEBTC: 'AE-BTC',
      ALGOBTC: 'ALGO-BTC',
      ARDRBTC: 'ARDR-BTC',
      ATOMBTC: 'ATOM-BTC',
      BLOCBTC: 'BLOC-BTC',
      BTTBTC: 'BTT-BTC',
      CAIBTC: 'CAI-BTC',
      CTXCBTC: 'CTXC-BTC',
      CVTBTC: 'CVT-BTC',
      DCRBTC: 'DCR-BTC',
      EGTBTC: 'EGT-BTC',
      GUSDBTC: 'GUSD-BTC',
      HPBBTC: 'HPB-BTC',
      HYCBTC: 'HYC-BTC',
      KANBTC: 'KAN-BTC',
      LBABTC: 'LBA-BTC',
      LEOBTC: 'LEO-BTC',
      LETBTC: 'LET-BTC',
      LSKBTC: 'LSK-BTC',
      NXTBTC: 'NXT-BTC',
      ORSBTC: 'ORS-BTC',
      PAXBTC: 'PAX-BTC',
      SCBTC: 'SC-BTC',
      TUSDBTC: 'TUSD-BTC',
      USDCBTC: 'USDC-BTC',
      VITEBTC: 'VITE-BTC',
      WAVESBTC: 'WAVES-BTC',
      WINBTC: 'WIN-BTC',
      XASBTC: 'XAS-BTC',
      YOUBTC: 'YOU-BTC',
      ZCOBTC: 'ZCO-BTC',
      ZILBTC: 'ZIL-BTC',
      XRPBTC: 'XRP-BTC',
      ELFBTC: 'ELF-BTC',
      LRCBTC: 'LRC-BTC',
      MCOBTC: 'MCO-BTC',
      NULSBTC: 'NULS-BTC',
      BCXBTC: 'BCX-BTC',
      CMTBTC: 'CMT-BTC',
      EDOBTC: 'EDO-BTC',
      ITCBTC: 'ITC-BTC',
      SBTCBTC: 'SBTC-BTC',
      ZECBTC: 'ZEC-BTC',
      NEOBTC: 'NEO-BTC',
      GASBTC: 'GAS-BTC',
      HCBTC: 'HC-BTC',
      QTUMBTC: 'QTUM-BTC',
      IOTABTC: 'IOTA-BTC',
      XUCBTC: 'XUC-BTC',
      EOSBTC: 'EOS-BTC',
      SNTBTC: 'SNT-BTC',
      OMGBTC: 'OMG-BTC',
      LTCBTC: 'LTC-BTC',
      ETHBTC: 'ETH-BTC',
      ETCBTC: 'ETC-BTC',
      BCDBTC: 'BCD-BTC',
      BTGBTC: 'BTG-BTC',
      ACTBTC: 'ACT-BTC',
      PAYBTC: 'PAY-BTC',
      BTMBTC: 'BTM-BTC',
      DGDBTC: 'DGD-BTC',
      GNTBTC: 'GNT-BTC',
      LINKBTC: 'LINK-BTC',
      WTCBTC: 'WTC-BTC',
      ZRXBTC: 'ZRX-BTC',
      BNTBTC: 'BNT-BTC',
      CVCBTC: 'CVC-BTC',
      MANABTC: 'MANA-BTC',
      KNCBTC: 'KNC-BTC',
      GNXBTC: 'GNX-BTC',
      ICXBTC: 'ICX-BTC',
      XEMBTC: 'XEM-BTC',
      ARKBTC: 'ARK-BTC',
      YOYOBTC: 'YOYO-BTC',
      FUNBTC: 'FUN-BTC',
      ACEBTC: 'ACE-BTC',
      TRXBTC: 'TRX-BTC',
      DGBBTC: 'DGB-BTC',
      SWFTCBTC: 'SWFTC-BTC',
      XMRBTC: 'XMR-BTC',
      XLMBTC: 'XLM-BTC',
      KCASHBTC: 'KCASH-BTC',
      MDTBTC: 'MDT-BTC',
      NASBTC: 'NAS-BTC',
      UGCBTC: 'UGC-BTC',
      DPYBTC: 'DPY-BTC',
      SSCBTC: 'SSC-BTC',
      AACBTC: 'AAC-BTC',
      VIBBTC: 'VIB-BTC',
      QUNBTC: 'QUN-BTC',
      INTBTC: 'INT-BTC',
      IOSTBTC: 'IOST-BTC',
      INSBTC: 'INS-BTC',
      MOFBTC: 'MOF-BTC',
      TCTBTC: 'TCT-BTC',
      STCBTC: 'STC-BTC',
      THETABTC: 'THETA-BTC',
      PSTBTC: 'PST-BTC',
      SNCBTC: 'SNC-BTC',
      MKRBTC: 'MKR-BTC',
      LIGHTBTC: 'LIGHT-BTC',
      OFBTC: 'OF-BTC',
      TRUEBTC: 'TRUE-BTC',
      SOCBTC: 'SOC-BTC',
      ZENBTC: 'ZEN-BTC',
      HMCBTC: 'HMC-BTC',
      ZIPBTC: 'ZIP-BTC',
      NANOBTC: 'NANO-BTC',
      CICBTC: 'CIC-BTC',
      GTOBTC: 'GTO-BTC',
      CHATBTC: 'CHAT-BTC',
      INSURBTC: 'INSUR-BTC',
      RBTC: 'R-BTC',
      BECBTC: 'BEC-BTC',
      MITHBTC: 'MITH-BTC',
      ABTBTC: 'ABT-BTC',
      BKXBTC: 'BKX-BTC',
      RFRBTC: 'RFR-BTC',
      TRIOBTC: 'TRIO-BTC',
      DADIBTC: 'DADI-BTC',
      ONTBTC: 'ONT-BTC',
      OKBBTC: 'OKB-BTC',
      ADAETH: 'ADA-ETH',
      ABLETH: 'ABL-ETH',
      AEETH: 'AE-ETH',
      ALGOETH: 'ALGO-ETH',
      ATOMETH: 'ATOM-ETH',
      BTTETH: 'BTT-ETH',
      CAIETH: 'CAI-ETH',
      CTXCETH: 'CTXC-ETH',
      DCRETH: 'DCR-ETH',
      EGTETH: 'EGT-ETH',
      HPBETH: 'HPB-ETH',
      HYCETH: 'HYC-ETH',
      KANETH: 'KAN-ETH',
      LBAETH: 'LBA-ETH',
      LEOETH: 'LEO-ETH',
      LETETH: 'LET-ETH',
      LSKETH: 'LSK-ETH',
      MVPETH: 'MVP-ETH',
      ORSETH: 'ORS-ETH',
      SCETH: 'SC-ETH',
      SDAETH: 'SDA-ETH',
      VITEETH: 'VITE-ETH',
      WAVESETH: 'WAVES-ETH',
      WINETH: 'WIN-ETH',
      YOUETH: 'YOU-ETH',
      ZCOETH: 'ZCO-ETH',
      ZILETH: 'ZIL-ETH',
      ELFETH: 'ELF-ETH',
      LTCETH: 'LTC-ETH',
      CMTETH: 'CMT-ETH',
      EDOETH: 'EDO-ETH',
      ITCETH: 'ITC-ETH',
      PRAETH: 'PRA-ETH',
      LRCETH: 'LRC-ETH',
      MCOETH: 'MCO-ETH',
      NULSETH: 'NULS-ETH',
      DGDETH: 'DGD-ETH',
      GNTETH: 'GNT-ETH',
      PAYETH: 'PAY-ETH',
      SNTETH: 'SNT-ETH',
      STORJETH: 'STORJ-ETH',
      ACTETH: 'ACT-ETH',
      BTMETH: 'BTM-ETH',
      EOSETH: 'EOS-ETH',
      OMGETH: 'OMG-ETH',
      DASHETH: 'DASH-ETH',
      XRPETH: 'XRP-ETH',
      ZECETH: 'ZEC-ETH',
      NEOETH: 'NEO-ETH',
      GASETH: 'GAS-ETH',
      HCETH: 'HC-ETH',
      QTUMETH: 'QTUM-ETH',
      IOTAETH: 'IOTA-ETH',
      XUCETH: 'XUC-ETH',
      ETCETH: 'ETC-ETH',
      LINKETH: 'LINK-ETH',
      WTCETH: 'WTC-ETH',
      ZRXETH: 'ZRX-ETH',
      BNTETH: 'BNT-ETH',
      CVCETH: 'CVC-ETH',
      MANAETH: 'MANA-ETH',
      GNXETH: 'GNX-ETH',
      ICXETH: 'ICX-ETH',
      XEMETH: 'XEM-ETH',
      ARKETH: 'ARK-ETH',
      YOYOETH: 'YOYO-ETH',
      TRXETH: 'TRX-ETH',
      DGBETH: 'DGB-ETH',
      PPTETH: 'PPT-ETH',
      SWFTCETH: 'SWFTC-ETH',
      XMRETH: 'XMR-ETH',
      XLMETH: 'XLM-ETH',
      KCASHETH: 'KCASH-ETH',
      MDTETH: 'MDT-ETH',
      NASETH: 'NAS-ETH',
      RNTETH: 'RNT-ETH',
      UGCETH: 'UGC-ETH',
      DPYETH: 'DPY-ETH',
      SSCETH: 'SSC-ETH',
      AACETH: 'AAC-ETH',
      FAIRETH: 'FAIR-ETH',
      RCTETH: 'RCT-ETH',
      VIBETH: 'VIB-ETH',
      TOPCETH: 'TOPC-ETH',
      QUNETH: 'QUN-ETH',
      INTETH: 'INT-ETH',
      IOSTETH: 'IOST-ETH',
      INSETH: 'INS-ETH',
      MOFETH: 'MOF-ETH',
      REFETH: 'REF-ETH',
      THETAETH: 'THETA-ETH',
      PSTETH: 'PST-ETH',
      SNCETH: 'SNC-ETH',
      MKRETH: 'MKR-ETH',
      LIGHTETH: 'LIGHT-ETH',
      OFETH: 'OF-ETH',
      TRUEETH: 'TRUE-ETH',
      SOCETH: 'SOC-ETH',
      ZENETH: 'ZEN-ETH',
      HMCETH: 'HMC-ETH',
      ZIPETH: 'ZIP-ETH',
      NANOETH: 'NANO-ETH',
      CICETH: 'CIC-ETH',
      GTOETH: 'GTO-ETH',
      INSURETH: 'INSUR-ETH',
      RETH: 'R-ETH',
      UCTETH: 'UCT-ETH',
      BECETH: 'BEC-ETH',
      MITHETH: 'MITH-ETH',
      ABTETH: 'ABT-ETH',
      BKXETH: 'BKX-ETH',
      AUTOETH: 'AUTO-ETH',
      RFRETH: 'RFR-ETH',
      TRIOETH: 'TRIO-ETH',
      TRAETH: 'TRA-ETH',
      DADIETH: 'DADI-ETH',
      ONTETH: 'ONT-ETH',
      OKBETH: 'OKB-ETH',
      BTCUSDK: 'BTC-USDK',
      LTCUSDK: 'LTC-USDK',
      ETHUSDK: 'ETH-USDK',
      OKBUSDK: 'OKB-USDK',
      ETCUSDK: 'ETC-USDK',
      BCHUSDK: 'BCH-USDK',
      BCHUSD: 'BCH-USDT',
      EOSUSDK: 'EOS-USDK',
      XRPUSDK: 'XRP-USDK',
      TRXUSDK: 'TRX-USDK',
      BSVUSDK: 'BSV-USDK',
      BSVUSD: 'BSV-USDT',
      USDTUSDK: 'USDT-USDK',
      ADAUSD: 'ADA-USDT',
      AEUSD: 'AE-USDT',
      ALGOUSDK: 'ALGO-USDK',
      ALGOUSD: 'ALGO-USDT',
      ALVUSD: 'ALV-USDT',
      ATOMUSD: 'ATOM-USDT',
      BLOCUSD: 'BLOC-USDT',
      BTTUSD: 'BTT-USDT',
      CAIUSD: 'CAI-USDT',
      CROUSDK: 'CRO-USDK',
      CROUSD: 'CRO-USDT',
      CTXCUSD: 'CTXC-USDT',
      CVTUSD: 'CVT-USDT',
      DCRUSD: 'DCR-USDT',
      EGTUSD: 'EGT-USDT',
      ETMUSDK: 'ETM-USDK',
      ETMUSD: 'ETM-USDT',
      FTMUSDK: 'FTM-USDK',
      FTMUSD: 'FTM-USDT',
      GUSDUSD: 'GUSD-USDT',
      HPBUSD: 'HPB-USDT',
      HYCUSD: 'HYC-USDT',
      KANUSD: 'KAN-USDT',
      LAMBUSDK: 'LAMB-USDK',
      LAMBUSD: 'LAMB-USDT',
      LBAUSD: 'LBA-USDT',
      LEOUSDK: 'LEO-USDK',
      LEOUSD: 'LEO-USDT',
      LETUSD: 'LET-USDT',
      LSKUSD: 'LSK-USDT',
      MVPUSD: 'MVP-USDT',
      ORSUSD: 'ORS-USDT',
      PAXUSD: 'PAX-USDT',
      SCUSD: 'SC-USDT',
      TUSDUSD: 'TUSD-USDT',
      USDCUSD: 'USDC-USDT',
      VNTUSDK: 'VNT-USDK',
      VNTUSD: 'VNT-USDT',
      WAVESUSD: 'WAVES-USDT',
      WINUSD: 'WIN-USDT',
      WXTUSDK: 'WXT-USDK',
      WXTUSD: 'WXT-USDT',
      XASUSD: 'XAS-USDT',
      YOUUSD: 'YOU-USDT',
      ZILUSD: 'ZIL-USDT',
      TRXOKB: 'TRX-OKB',
      ADAOKB: 'ADA-OKB',
      AEOKB: 'AE-OKB',
      BLOCOKB: 'BLOC-OKB',
      CAIOKB: 'CAI-OKB',
      DCROKB: 'DCR-OKB',
      EGTOKB: 'EGT-OKB',
      HPBOKB: 'HPB-OKB',
      KANOKB: 'KAN-OKB',
      LBAOKB: 'LBA-OKB',
      LETOKB: 'LET-OKB',
      NASOKB: 'NAS-OKB',
      ORSOKB: 'ORS-OKB',
      SCOKB: 'SC-OKB',
      SDAOKB: 'SDA-OKB',
      VITEOKB: 'VITE-OKB',
      WAVESOKB: 'WAVES-OKB',
      WINOKB: 'WIN-OKB',
      XASOKB: 'XAS-OKB',
      YOUOKB: 'YOU-OKB',
      ZCOOKB: 'ZCO-OKB',
      ELFUSD: 'ELF-USDT',
      DASHUSD: 'DASH-USDT',
      BTGUSD: 'BTG-USDT',
      LRCUSD: 'LRC-USDT',
      MCOUSD: 'MCO-USDT',
      NULSUSD: 'NULS-USDT',
      DASHOKB: 'DASH-OKB',
      XRPUSD: 'XRP-USDT',
      ZECUSD: 'ZEC-USDT',
      NEOUSD: 'NEO-USDT',
      GASUSD: 'GAS-USDT',
      HCUSD: 'HC-USDT',
      QTUMUSD: 'QTUM-USDT',
      IOTAUSD: 'IOTA-USDT',
      BTCUSD: 'BTC-USDT',
      BCDUSD: 'BCD-USDT',
      XUCUSD: 'XUC-USDT',
      CMTUSD: 'CMT-USDT',
      EDOUSD: 'EDO-USDT',
      ITCUSD: 'ITC-USDT',
      PRAUSD: 'PRA-USDT',
      ETHUSD: 'ETH-USDT',
      LTCUSD: 'LTC-USDT',
      ETCUSD: 'ETC-USDT',
      EOSUSD: 'EOS-USDT',
      OMGUSD: 'OMG-USDT',
      ACTUSD: 'ACT-USDT',
      BTMUSD: 'BTM-USDT',
      DGDUSD: 'DGD-USDT',
      GNTUSD: 'GNT-USDT',
      PAYUSD: 'PAY-USDT',
      STORJUSD: 'STORJ-USDT',
      SNTUSD: 'SNT-USDT',
      LINKUSD: 'LINK-USDT',
      WTCUSD: 'WTC-USDT',
      ZRXUSD: 'ZRX-USDT',
      BNTUSD: 'BNT-USDT',
      CVCUSD: 'CVC-USDT',
      MANAUSD: 'MANA-USDT',
      KNCUSD: 'KNC-USDT',
      ICXUSD: 'ICX-USDT',
      XEMUSD: 'XEM-USDT',
      ARKUSD: 'ARK-USDT',
      YOYOUSD: 'YOYO-USDT',
      ASTUSD: 'AST-USDT',
      TRXUSD: 'TRX-USDT',
      MDAUSD: 'MDA-USDT',
      DGBUSD: 'DGB-USDT',
      PPTUSD: 'PPT-USDT',
      SWFTCUSD: 'SWFTC-USDT',
      XMRUSD: 'XMR-USDT',
      XLMUSD: 'XLM-USDT',
      KCASHUSD: 'KCASH-USDT',
      MDTUSD: 'MDT-USDT',
      NASUSD: 'NAS-USDT',
      RNTUSD: 'RNT-USDT',
      UGCUSD: 'UGC-USDT',
      DPYUSD: 'DPY-USDT',
      SSCUSD: 'SSC-USDT',
      AACUSD: 'AAC-USDT',
      FAIRUSD: 'FAIR-USDT',
      UBTCUSD: 'UBTC-USDT',
      SHOWUSD: 'SHOW-USDT',
      VIBUSD: 'VIB-USDT',
      MOTUSD: 'MOT-USDT',
      UTKUSD: 'UTK-USDT',
      TOPCUSD: 'TOPC-USDT',
      QUNUSD: 'QUN-USDT',
      INTUSD: 'INT-USDT',
      IPCUSD: 'IPC-USDT',
      IOSTUSD: 'IOST-USDT',
      INSUSD: 'INS-USDT',
      YEEUSD: 'YEE-USDT',
      MOFUSD: 'MOF-USDT',
      TCTUSD: 'TCT-USDT',
      STCUSD: 'STC-USDT',
      THETAUSD: 'THETA-USDT',
      PSTUSD: 'PST-USDT',
      MKRUSD: 'MKR-USDT',
      LIGHTUSD: 'LIGHT-USDT',
      OFUSD: 'OF-USDT',
      TRUEUSD: 'TRUE-USDT',
      SOCUSD: 'SOC-USDT',
      ZENUSD: 'ZEN-USDT',
      HMCUSD: 'HMC-USDT',
      ZIPUSD: 'ZIP-USDT',
      NANOUSD: 'NANO-USDT',
      CICUSD: 'CIC-USDT',
      GTOUSD: 'GTO-USDT',
      CHATUSD: 'CHAT-USDT',
      INSURUSD: 'INSUR-USDT',
      RUSD: 'R-USDT',
      BECUSD: 'BEC-USDT',
      MITHUSD: 'MITH-USDT',
      ABTUSD: 'ABT-USDT',
      BKXUSD: 'BKX-USDT',
      RFRUSD: 'RFR-USDT',
      TRIOUSD: 'TRIO-USDT',
      DADIUSD: 'DADI-USDT',
      ONTUSD: 'ONT-USDT',
      OKBUSD: 'OKB-USDT',
      NEOOKB: 'NEO-OKB',
      LTCOKB: 'LTC-OKB',
      ETCOKB: 'ETC-OKB',
      XRPOKB: 'XRP-OKB',
      ZECOKB: 'ZEC-OKB',
      QTUMOKB: 'QTUM-OKB',
      IOTAOKB: 'IOTA-OKB',
      EOSOKB: 'EOS-OKB',
      'BTCUSD-SWAP': 'BTC-USD-SWAP',
      'LTCUSD-SWAP': 'LTC-USD-SWAP',
      'ETHUSD-SWAP': 'ETH-USD-SWAP',
      'TRXUSD-SWAP': 'TRX-USD-SWAP',
      'BCHUSD-SWAP': 'BCH-USD-SWAP',
      'BSVUSD-SWAP': 'BSV-USD-SWAP',
      'EOSUSD-SWAP': 'EOS-USD-SWAP',
      'XRPUSD-SWAP': 'XRP-USD-SWAP',
      'ETCUSD-SWAP': 'ETC-USD-SWAP',
      'BTCUSD-THIS_WEEK': 'BTC-USD-190705',
      'BTCUSD-NEXT_WEEK': 'BTC-USD-190712',
      'BTCUSD-QUARTER': 'BTC-USD-190927',
      'LTCUSD-THIS_WEEK': 'LTC-USD-190705',
      'LTCUSD-NEXT_WEEK': 'LTC-USD-190712',
      'LTCUSD-QUARTER': 'LTC-USD-190927',
      'ETHUSD-THIS_WEEK': 'ETH-USD-190705',
      'ETHUSD-NEXT_WEEK': 'ETH-USD-190712',
      'ETHUSD-QUARTER': 'ETH-USD-190927',
      'ETCUSD-THIS_WEEK': 'ETC-USD-190705',
      'ETCUSD-NEXT_WEEK': 'ETC-USD-190712',
      'ETCUSD-QUARTER': 'ETC-USD-190927',
      'XRPUSD-THIS_WEEK': 'XRP-USD-190705',
      'XRPUSD-NEXT_WEEK': 'XRP-USD-190712',
      'XRPUSD-QUARTER': 'XRP-USD-190927',
      'BCHUSD-THIS_WEEK': 'BCH-USD-190705',
      'BCHUSD-NEXT_WEEK': 'BCH-USD-190712',
      'BCHUSD-QUARTER': 'BCH-USD-190927',
      'BSVUSD-THIS_WEEK': 'BSV-USD-190705',
      'BSVUSD-NEXT_WEEK': 'BSV-USD-190712',
      'BSVUSD-QUARTER': 'BSV-USD-190927',
      'EOSUSD-THIS_WEEK': 'EOS-USD-190705',
      'EOSUSD-NEXT_WEEK': 'EOS-USD-190712',
      'EOSUSD-QUARTER': 'EOS-USD-190927',
      'TRXUSD-THIS_WEEK': 'TRX-USD-190705',
      'TRXUSD-NEXT_WEEK': 'TRX-USD-190712',
      'TRXUSD-QUARTER': 'TRX-USD-190927'
    }

    this.options = Object.assign(
      {
        url: 'wss://real.okex.com:10442/ws/v3'
      },
      this.options
    )
  }

  connect(pair) {
    if (!super.connect(pair)) return

    this.api = new WebSocket(this.getUrl())

    this.api.binaryType = 'arraybuffer'

    this.api.onmessage = event => this.emitData(this.format(event.data))

    this.api.onopen = event => {
      this.api.send(
        JSON.stringify({
          op: 'subscribe',
          args: [`${this.type}/trade:${this.pair}`]
        })
      )

      this.initKeepAlive()
      this.initPeriodicFuturesRefresh()
      this.initPeriodicLiquidationsRefresh()

      this.emitOpen(event)
    }

    this.api.onclose = event => {
      this.emitClose(event)
      
      clearInterval(this.keepaliveInterval)
      clearTimeout(this.periodicFuturesRefreshTimeout)
      clearInterval(this.periodicLiquidationsRefreshInterval);
    }

    this.api.onerror = this.emitError.bind(this, { message: 'Websocket error' })
  }

  disconnect() {
    if (!super.disconnect()) return

    if (this.api && this.api.readyState < 2) {
      this.api.close()
    }
  }

  format(event) {
    let json

    try {
      if (event instanceof String) {
        json = JSON.parse(event)
      } else {
        json = JSON.parse(pako.inflateRaw(event, { to: 'string' }))
      }
    } catch (error) {
      return
    }

    if (!json || !json.data || !json.data.length) {
      return
    }

    return json.data.map(trade => {
      let size

      if (this.type === 'spot') {
        size = +trade.size
      } else {
        size = ((trade.size || trade.qty) * (/^BTC/.test(this.pair) ? 100 : 10)) / trade.price
      }

      return [+new Date(trade.timestamp), +trade.price, size, trade.side === 'buy' ? 1 : 0]
    })
  }

  formatProducts(response, type) {
    response.forEach(product => {
      const pair = (
        (product.base_currency ? product.base_currency : product.underlying_index) +
        product.quote_currency.replace(/usdt$/i, 'USD')
      ).toUpperCase() // base+quote ex: BTCUSD

      switch (type) {
        case 'spot':
          this.pairs[pair] = product.instrument_id
          break
        case 'swap':
          this.pairs[pair + '-SWAP'] = product.instrument_id
          break
        case 'futures':
          this.pairs[pair + '-' + product.alias.toUpperCase()] = product.instrument_id
          break
      }
    })

    return output
  }

  initKeepAlive() {
    this.keepaliveInterval = setInterval(() => {
      this.api.send('ping')
    }, 30000)
  }

  initPeriodicFuturesRefresh() {
    const now = new Date()

    // next friday
    now.setDate(now.getDate() + ((7 + 5 - now.getDay()) % 7))

    // exp timestamp hong kong time
    let msUntilExpiration =
      +new Date(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} 16:00:00+08:00`) -
      +new Date()

    console.log('will expire after', msUntilExpiration, 'ms')

    const setupTimer = () => {
      console.log('will getProducts at', new Date(+new Date() + msUntilExpiration))

      this.periodicFuturesRefreshTimeout = setTimeout(() => {
        msUntilExpiration = 1000 * 60 * 60 * 24 * 7

        this.getProducts('futures')

        setupTimer()
      }, msUntilExpiration)
    }

    setupTimer()
  }

  initPeriodicLiquidationsRefresh() {
    this.liquidatableProducts = []
    this.liquidatableProductsReferences = {}

    const now = +new Date()
    const products = Object.keys(this.pairs)
    console.log('initPeriodicLiquidationsRefresh')

    for (let i = 0; i < products.length; i++) {
      if (new RegExp('^' + this.pair.split('-')[0] + 'USD-').test(products[i])) {
        console.log('add', products[i], 'to liquidatable products')
        this.liquidatableProducts.push(this.pairs[products[i]])
        this.liquidatableProductsReferences[this.pairs[products[i]]] = now
      }
    }

    if (!this.liquidatableProducts.length) {
      return
    }

    this.liquidatableProductsIndex = 0

    this.periodicLiquidationsRefreshInterval = setInterval(() => {
      this.getLiquidations(
        this.liquidatableProducts[this.liquidatableProductsIndex % this.liquidatableProducts.length]
      )

      this.liquidatableProductsIndex++
    }, 1500)
  }

  getProducts(type) {
    this.productRequest && this.productRequest.cancel()

    const token = axios.CancelToken
    this.productRequest = token.source()
    console.log('getProducts', type);

    axios
      .get(`https://www.okex.com/api/${type}/v3/instruments`)
      .then(response => this.formatProducts(response, type))
      .catch(error => {
        console.log('catch', error);
        if (axios.isCancel(error)) {
          console.log('axios.isCancel');
          return
        }

        this.emitError(error)

        return error
      })
      .then(() => {
        delete this.productRequest
      })
  }

  getLiquidations(instrumentId) {
    this.liquidationRequest && this.liquidationRequest.cancel()

    const token = axios.CancelToken
    this.liquidationRequest = token.source()

    const type = /SWAP/.test(instrumentId) ? 'swap' : 'futures'

    axios
      .get(
        `https://www.okex.com/api/${type}/v3/instruments/${instrumentId}/liquidation?status=1&limit=10`
      )
      .then(response => {
        if (!response.data || (response.data.error && response.data.error.length)) {
          console.log('getLiquidations => then => contain error(s)')
          this.emitError(new Error(response.data.error.join('\n')))
          return
        }

        const liquidations = response.data.filter(a => {
          return (
            !this.liquidatableProductsReferences[instrumentId] ||
            +new Date(a.created_at) > this.liquidatableProductsReferences[instrumentId]
          )
        })

        if (!liquidations.length) {
          return
        }

        this.liquidatableProductsReferences[instrumentId] = +new Date(liquidations[0].created_at)
        
        console.log('sending', liquidations.length, 'okex liquidations');

        this.emitData(
          liquidations.map(trade => {
            const timestamp = +new Date(trade.created_at)
            const size = (trade.size * (/^BTC/.test(this.pair) ? 100 : 10)) / trade.price

            return [timestamp, +trade.price, size, trade.type === '4' ? 1 : 0, 1]
          })
        )
      })
      .catch(error => {
        console.log('catch');
        console.log(error);
        if (axios.isCancel(error)) {
          console.log('axios.isCancel');
          return
        }

        this.emitError(error)

        return error
      })
      .then(() => {
        delete this.liquidationRequest
      })
  }
}

module.exports = Okex
