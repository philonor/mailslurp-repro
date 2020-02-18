import {BrowserStackErrorReporter, Helpers} from 'originstamp-web-e2e';
import {browser, Key, protractor} from 'protractor';
import {MailSlurpHelper} from '../abstract/mail-slurp-helper.type';
import {SigninPage} from './signin.page';
import {SignupPage} from './signup.page';

describe ('SignupPage', () => {

  let signupPage: SignupPage,
    inbox,
    mail,
    pwd;

  beforeAll (async () => {
    await BrowserStackErrorReporter.registerSession ();
    // Generate random mail.
    inbox = await MailSlurpHelper.getRandomInbox ();
    mail = inbox.mailAddress;
    // Generate random password.
    pwd = Helpers.getRandomPwd ();
  });
  afterEach (() => BrowserStackErrorReporter.reportSpecErrors ());
  afterAll (async () => {
    await BrowserStackErrorReporter.reportErrors ();
    // Delete random mail.
    await MailSlurpHelper.deleteInbox (inbox);
  });

 describe ('Account activation and login', () => {

    it ('should send a verification email to user inbox', async () => {
      // First, check for new mail.
      console.log (`Using mail address ${JSON.stringify (mail)}`);
      const email = await MailSlurpHelper.waitForLatestEmail (inbox);
      console.log (`Existing mail with subject ${email.subject} from ${email.from}`);
      // Activation link should be present.
      const raw = await MailSlurpHelper.getRawContent (email.id);
      expect (email.subject).toEqual ('Account Verification');
      // Find activation link.
      const link = MailSlurpHelper.getLink (raw, /(https:\/\/api(dev)?\.originstamp\.com\/api\/account\/activate\?token=[a-zA-Z0-9-_.]+)/gm);
      expect (link).not.toBeNull ();
      console.log (`Corresponding link ${link}`);
      // @Jack this simulates link click and will yield the second email to be sent to MailSlurp inbox.
      await browser.get (link, SignupPage.DEFAULT_WAIT_TIMEOUT);
      // Wait for browser url to have changed (we can't check for localhost as API redirects to
      // my.originstamp.com or dashboard.prev.originstamp.com.
      await browser.wait (protractor.ExpectedConditions
        .urlContains ('/sessions/signin'), SignupPage.DEFAULT_WAIT_TIMEOUT);
    });

    it ('should send a confirmation email to user inbox', async () => {
      // First, check for new mail.
      console.log (`Using mail address ${JSON.stringify (mail)}`);
      const emails = await MailSlurpHelper.waitForEmailCount (inbox, 2);
      const email = emails.find ((el) => el.subject.startsWith ('Account Activation successful'));
      console.log (`Existing mail with subject ${email.subject}`);
      // Activation link should be present.
      const raw = await MailSlurpHelper.getRawContent (email.id);
      expect (email.subject).toEqual ('Account Activation successful');
      // Find activation link.
      const link = MailSlurpHelper.getLink (raw, /(https:\/\/redir\.originstamp\.com(\/staging)?\/dashboard\/sessions\/signin)/gm);
      expect (link).not.toBeNull ();
      console.log (`Corresponding link ${link}`);
      // Wait for browser url to have changed (we can't check for localhost as API redirects to
      // my.originstamp.com or dashboard.prev.originstamp.com.
      await browser.wait (protractor.ExpectedConditions
        .urlContains ('/sessions/signin'), SignupPage.DEFAULT_WAIT_TIMEOUT);
    });

    it ('should login with activated account', async () => {
      const signinPage = await new SigninPage ();
      await signinPage.init ();
      // Expect correct elements to be present.
      expect (signinPage.inpMail.isPresent ()).toBeTruthy ();
      expect (signinPage.inpPwd.isPresent ()).toBeTruthy ();
      expect (signinPage.inpRememberMe.isPresent ()).toBeTruthy ();
      expect (signinPage.btnSubmit.isPresent ()).toBeTruthy ();
      // Fill form.
      signinPage.inpMail.nativeElement.sendKeys (mail.full);
      signinPage.inpPwd.nativeElement.sendKeys (pwd);
      signinPage.btnSubmit.nativeElement.sendKeys (Key.ENTER);
      // Wait for browser url to have changed.
      await browser.wait (protractor.ExpectedConditions
        .urlIs (browser.baseUrl + 'my/dashboard'), SignupPage.DEFAULT_WAIT_TIMEOUT);
    });

  });

});

