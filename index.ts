import "dotenv/config"

import { readFile } from 'node:fs/promises'

import { Browser, Page, ElementHandle } from "puppeteer"
const puppeteer = require("puppeteer-extra")

import StealthPlugin from 'puppeteer-extra-plugin-stealth'
puppeteer.use(StealthPlugin())

const timer = (ms: number) => new Promise(res => setTimeout(res, ms))

const extractText = async (element: ElementHandle<HTMLElement>) => {
    const ret = await element.evaluate((el) => {
        const result = { text: "" }
        const siftThroughElement = (e: HTMLElement, res: typeof result) => {
            if (!e.hasChildNodes()) return
            e.childNodes.forEach((child) => {
                if (child.nodeType === 3) {
                    let text = ""
                    for (const char of child.nodeValue) {
                        switch (char) {
                            case "\"":
                                text += "\""
                                break
                            case "\'":
                                text += "\'"
                                break
                            case "\\":
                                text += "\\"
                                break
                            case "\t":
                                text += " "
                                break
                            default:
                                text += char
                        }
                    }
                    if (/^\s*$/.test(text)) return
                    res.text += text.trim() + "\n"
                }
                
                if (child.nodeType === 1) {
                    siftThroughElement(child as HTMLElement, res)
                }
            })
        }
    
        if (el)
            siftThroughElement(el, result)

        return result.text
    })

    return ret
}

const jobMatch = async (jobDescription: string) => {
    const { ChatOpenAI } =  await import("@langchain/openai")
    const { ChatPromptTemplate } = await import("@langchain/core/prompts")
    const { StringOutputParser } = await import("@langchain/core/output_parsers")

    const systemTemplate = await readFile("prompt.txt", { encoding: 'utf8' })

    const chatPrompt = ChatPromptTemplate.fromMessages([
        ["system", systemTemplate]
    ]);

    const resume = await readFile("resume.txt", { encoding: 'utf8' })

    const formattedChatPrompt = await chatPrompt.formatMessages({
        job_description: jobDescription,
        resume: resume,
    })

    const chatModel = new ChatOpenAI({
        modelName: "gpt-4-1106-preview",
    })

    const outputParser = new StringOutputParser()

    const output = await chatModel.invoke(formattedChatPrompt)
    let response = await outputParser.invoke(output)

    if (response.length > 3) response = "0"
    if (isNaN(parseInt(response))) response = "0"
    console.log(response)
    return parseInt(response) > 0
}

const apply = async (jobPosting: string, page: Page) => {
    console.log(jobPosting)
}

const openJobSearch = async (page: Page) => {
    let jobSearchURL = new URL(process.env.LINKEDIN_JOB_SEARCH_URL)
    try {
        jobSearchURL = new URL(process.env.LINKEDIN_JOB_SEARCH_URL)
    } catch(err) {
        console.log(err)
        return
    }

    try {
        await page.goto("https://www.linkedin.com")
    } catch (err) {
        console.log(err)
        return
    }

    const emailInput = await page.$("input#session_key")
    await emailInput.evaluate((input, email) => {
        input.value = email
    }, process.env.LINKEDIN_EMAIL)

    const passwordInput = await page.$("input#session_password")
    await passwordInput.evaluate((input, password) => {
        input.value = password
    }, process.env.LINKEDIN_PASSWORD)

    const button = await page.$$(".btn-md.btn-primary.flex-shrink-0.cursor-pointer.sign-in-form__submit-btn--full-width")
    await button[0].evaluate((btn: HTMLButtonElement) => {
        btn.click()
    })

    await timer(1000 * 2)

    const headers = await page.$$("h1")
    const securityCheck = await headers[0].evaluate((el) => {
        return el && el.innerText === "Let's do a quick security check"
    })

    if (securityCheck)
        await timer(1000 * 15)
    else
    await timer(1000 * 2)

    try {
        await page.goto(jobSearchURL.toString())
    } catch (err) {
        console.log(err)
        return
    }

    await timer(1000 * 2)

    let currentPage = 1
    let lastPageReached = false
    while (!lastPageReached) {
        lastPageReached = true

        const jobListings = await page.$$("a.job-card-container__link")
        const links: string[] = []
        for (const listing of jobListings) {
            links.push(await listing.evaluate((el) => { return el.href }))
        }

        for (const link of links) {
            try {
                await page.goto(link)
            } catch (err) {
                console.log(err)
                continue
            }

            await timer(1000 * 2)

            const jobDescription = await page.$("div#job-details")
            const text = await extractText(jobDescription)

            if (await jobMatch(text)) {
                apply(link, page)
            }
        }

        try {
            await page.goto(jobSearchURL.toString())
        } catch (err) {
            console.log(err)
            return
        }

        await timer(1000 * 2)

        const pageBtns = await page.$$(".artdeco-pagination__indicator.artdeco-pagination__indicator--number.ember-view")
        for (const btn of pageBtns) {
            const clickableBtn = await btn.$("button")
            const btnNumber = await clickableBtn.$("span")
            const isNextBtn = await btnNumber.evaluate((el, pageNumber) => {
                return el.innerHTML === `${pageNumber + 1}`
            }, currentPage)
            if (isNextBtn) {
                await clickableBtn.evaluate((el) => {
                    el.click()
                })
                await timer(1000 * 2)
                try {
                    jobSearchURL = new URL(page.url())
                } catch(err) {
                    console.log(err)
                    return
                }
                currentPage++
                lastPageReached = false
                break
            }
        }
    }
    
    await timer(1000 * 60 * 5)
}

const findJobs = async () => {
    const browser: Browser = await puppeteer.default.launch({ headless: false, ignoreHTTPSErrors: true })

    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 10000 })

    await openJobSearch(page)

    await browser.close()
    console.log("crawl process has completed")
}

const main = async () => {
    await findJobs()
}
main()