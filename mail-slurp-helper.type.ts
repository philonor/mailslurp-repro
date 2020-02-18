import {MailSlurp} from 'mailslurp-client';
import {Email, EmailPreview, Inbox} from 'mailslurp-swagger-sdk-ts';
import {MailAddress} from 'originstamp-web-e2e/dist/helpers/mail-address.type';

const axios = require ('axios');

/**
 * Implements functionality to create and check inboxes on MailSlurp.
 */
export class MailSlurpHelper {

  /* MailSlurp default wait timeout. */
  public static DEFAULT_WAIT_TIMEOUT = 20000;

  /* MailSlurp API key. */
  private static _API_KEY = '';

  /* MailSlup instance (if any). */
  private static _instance: MailSlurp = null;

  /* Gets a MailSlurp instance or creates a new. */
  public static getInstance (): MailSlurp {
    if (MailSlurpHelper._instance) {
      return MailSlurpHelper._instance;
    }
    return new MailSlurp ({apiKey: MailSlurpHelper._API_KEY});
  }

  /* Gets a MailSlup inbox by id. */
  public static async getInboxById (shortId: string): Promise<any> {
    const instance = MailSlurpHelper.getInstance ();
    const inboxes = await instance.getInboxes ();
    const inbox = inboxes
      .filter ((el) => el.id.startsWith (shortId))[0];
    return MailSlurpHelper._mapInbox (inbox);
  }

  /* Gets a new mail address by creating a random MailSlurp inbox. */
  public static async getRandomInbox (): Promise<any> {
    const instance = MailSlurpHelper.getInstance ();
    const inbox = await instance.createInbox ();
    return MailSlurpHelper._mapInbox (inbox);
  }

  /* Maps a MailSlurp inbox to a more generalized object also containing mail address information. */
  private static _mapInbox (inbox: Inbox): any {
    const tmp = inbox.emailAddress.split ('@');
    return {
      id: inbox.id,
      mailAddress: {
        full: inbox.emailAddress,
        localPart: tmp[0],
        domain: tmp[1]
      } as MailAddress
    };
  }

  /* Deletes an inbox. */
  public static async deleteInbox (inbox): Promise<any> {
    const instance = MailSlurpHelper.getInstance ();
    return await instance.deleteInbox (inbox.id);
  }

  /* Waits for latest email. Closely received mails may result in wrong mail to be returned. */
  public static async waitForLatestEmail (inbox, timeout?: number): Promise<Email> {
    const instance = MailSlurpHelper.getInstance ();
    return await instance.waitForLatestEmail (inbox.id, timeout || MailSlurpHelper.DEFAULT_WAIT_TIMEOUT);
  }

  /* Waits until inbox contains certain number of emails. */
  public static async waitForEmailCount (inbox, count: number, timeout?: number): Promise<EmailPreview[]> {
    const instance = MailSlurpHelper.getInstance ();
    return await instance.waitForEmailCount (count, inbox.id, timeout || MailSlurpHelper.DEFAULT_WAIT_TIMEOUT);
  }

  /* Gets a mail's raw content. */
  public static async getRawContent (emailId): Promise<any> {
    return axios
      .get (`https://api.mailslurp.com/emails/${emailId}/raw`, {
        headers: {'X-API-Key': MailSlurpHelper._API_KEY}
      })
      .then ((res) => res.data);
    // Correct way would be as follows, but MailSlurp can't correctly parse JSON response.
    /*const instance = MailSlurpHelper.getInstance();
     return await instance.getRawEmail(emailId);*/
  }

  /* Searches a certain link within raw mail content and returns it, if found. */
  public static getLink (rawMailContent, regEx): string {
    const match = regEx.exec (rawMailContent);
    return match && match.length >= 2
           ? match[1]
           : null;
  }

}

