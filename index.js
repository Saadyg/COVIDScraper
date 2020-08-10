const puppeteer = require('puppeteer-extra');
const puppeteerExtraPluginStealth = require('puppeteer-extra-plugin-stealth');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const clientCreds = require('./client_creds.json');

puppeteer.use(puppeteerExtraPluginStealth());


const main = async () => {
    var rows = [];

    try {

        const doc = new GoogleSpreadsheet('1wMm80NEUasw6GqsOTU7xpt2qyPWScC1P1h7tx71Y-wY');
        await doc.useServiceAccountAuth(clientCreds);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];


        const browser = await puppeteer.launch({
            headless: false,
            sloMo: 50
        })
        const page = (await browser.pages())[0];

        page.on('load', async () => {
            if (page.url().indexOf('login.proxy.lib.wayne.edu') != -1) {
                wayneLogin(page);
                await page.waitForNavigation();
            }
        })
        page.on('dialog', () => {
            page.dismiss();
        })

        await page.goto('https://www-nejm-org.proxy.lib.wayne.edu/search?date=completeArchive&q=covid-19&isAdvancedSearch=true#qs=%3Fdate%3DcompleteArchive%26q%3Dcovid-19%26requestType%3Dajax%26viewClass%3D%26isAdvancedSearch%3Dtrue%26sort%3Dscore%26manualFilterParam%3DcontentAge_delimiter_contentAge_firstDelimiter')
        await page.waitFor(5000)

        var j = 0;
        for (let x = 0; x < 10; x++) {
            var url = page.url();
            for (let i = 0; i < 20; i++) {
                try {
                    rows.push({
                        Title: await page.evaluate(`document.getElementsByClassName("m-result__title")[${i}].innerText`),
                        Author: await page.evaluate(`document.getElementsByClassName("m-result__author")[${i}].innerText`),
                        Date: await page.evaluate(`document.getElementsByClassName("m-result__date")[${i}].innerText`),
                        Email: await getEmail(page, i)
                    })
                    console.log(rows[j]);
                    await sheet.addRow(rows[j]);
                    j++;
                } catch (e) {
                    console.log('Scrape Failed', e)
                }
                await page.goto(url);
                await page.waitFor(2000);
            }
            await page.click('span.a-btn__label')[1];
            await page.waitFor(2000);
        }
        

    } catch (e) {
        console.log('OUR ERROR', e);
    }
}

main()

const getEmail = async (page, i) => {
    try {

        const links = await page.$$("strong.m-result__title");
        await links[i].click();
        await page.waitForSelector('a.email', {timeout:3000});
        await page.waitFor(1500);

        var email = page.evaluate(() => document.getElementsByClassName("email")[0].innerText);

        return await email;

    } catch (e) {
        console.log('email not found');
    }
}

const wayneLogin = async page => {
    try {

        await page.waitForSelector('input#user');
        await page.type('input#user', 'hd3635');
        await page.type('input#pass', 'Sm55527779');
        await page.click('button.btn');

    } catch (e) {
        console.log('OUR ERROR', e)
    }
}


