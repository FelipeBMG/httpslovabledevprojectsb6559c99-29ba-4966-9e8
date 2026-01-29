// Webhook utility functions

const WEBHOOK_BASE_URL = 'https://petzap-n8n.slfjaq.easypanel.host/webhook';

export interface CreateWebhookPayload {
  action: 'create';
  pet_name: string;
  service: string;
  start_date: string;
  end_date: string;
  client_name: string;
}

export interface UpdateWebhookPayload {
  action: 'update';
  google_event_id: string;
  pet_name: string;
  service: string;
  start_date: string;
  end_date: string;
  client_name: string;
}

export interface DeleteWebhookPayload {
  action: 'delete';
  google_event_id: string;
}

export interface WebhookResponse {
  success: boolean;
  google_id?: string;
  message?: string;
}

// Send CREATE webhook and return the google_id from response
export const sendCreateWebhook = async (payload: CreateWebhookPayload): Promise<WebhookResponse> => {
  try {
    const response = await fetch(`${WEBHOOK_BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Webhook failed:', response.status, response.statusText);
      return { success: false, message: `HTTP ${response.status}` };
    }

    // Try to parse response to get google_id
    try {
      const data = await response.json();
      console.log('Webhook response:', data);
      return { 
        success: true, 
        google_id: data.google_id || data.googleId || data.event_id || data.eventId,
        message: 'Webhook sent successfully'
      };
    } catch {
      // Response might not be JSON
      console.log('Webhook sent successfully (no JSON response)');
      return { success: true };
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return { success: false, message: String(error) };
  }
};

// Send UPDATE webhook
export const sendUpdateWebhook = async (payload: UpdateWebhookPayload): Promise<WebhookResponse> => {
  try {
    const response = await fetch(`${WEBHOOK_BASE_URL}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Update webhook failed:', response.status, response.statusText);
      return { success: false, message: `HTTP ${response.status}` };
    }

    try {
      const data = await response.json();
      console.log('Update webhook response:', data);
      return { success: true, google_id: data.google_id, message: 'Update webhook sent successfully' };
    } catch {
      console.log('Update webhook sent successfully (no JSON response)');
      return { success: true };
    }
  } catch (error) {
    console.error('Update webhook error:', error);
    return { success: false, message: String(error) };
  }
};

// Send DELETE webhook
export const sendDeleteWebhook = async (payload: DeleteWebhookPayload): Promise<WebhookResponse> => {
  try {
    const response = await fetch(`${WEBHOOK_BASE_URL}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Delete webhook failed:', response.status, response.statusText);
      return { success: false, message: `HTTP ${response.status}` };
    }

    try {
      const data = await response.json();
      console.log('Delete webhook response:', data);
      return { success: true, message: 'Delete webhook sent successfully' };
    } catch {
      console.log('Delete webhook sent successfully (no JSON response)');
      return { success: true };
    }
  } catch (error) {
    console.error('Delete webhook error:', error);
    return { success: false, message: String(error) };
  }
};
