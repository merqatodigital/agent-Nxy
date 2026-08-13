import { AgentObjective, AgentTask, TaskType } from './types.js';
import { saveTask } from './store.js';

export class AgentPlanner {
  /**
   * Plans and queues concrete operational tasks for a given objective.
   */
  public async planObjectiveTasks(
    objective: AgentObjective,
    prospects: any[] = []
  ): Promise<AgentTask[]> {
    const createdTasks: AgentTask[] = [];

    // Identify target prospects or create default pipeline tasks
    const targetProspects = prospects.length > 0 ? prospects : [{ id: 'lead-default', companyName: 'Target Lead', website: 'apexcloud.io', contactEmail: 'alex@apexcloud.io', contactName: 'Alex' }];

    for (const prospect of targetProspects) {
      const timestamp = new Date().toISOString();
      const baseId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      // Task 1: CRM Lookup
      const crmTask: AgentTask = {
        id: `${baseId}-crm`,
        objectiveId: objective.id,
        prospectId: prospect.id,
        type: 'CRM_LOOKUP',
        status: 'queued',
        priority: objective.priority,
        attempts: 0,
        maxAttempts: 3,
        scheduledAt: timestamp,
        arguments: {
          company_name: prospect.companyName,
          domain: prospect.website
        }
      };
      await saveTask(crmTask);
      createdTasks.push(crmTask);

      // Task 2: Web Scrape
      const scrapeTask: AgentTask = {
        id: `${baseId}-scrape`,
        objectiveId: objective.id,
        prospectId: prospect.id,
        type: 'WEB_SCRAPE',
        status: 'queued',
        priority: objective.priority,
        attempts: 0,
        maxAttempts: 3,
        scheduledAt: new Date(Date.now() + 500).toISOString(),
        arguments: {
          url: prospect.website || `https://${prospect.companyName.toLowerCase().replace(/\s+/g, '')}.com`
        }
      };
      await saveTask(scrapeTask);
      createdTasks.push(scrapeTask);

      // Task 3: Draft Email
      const draftTask: AgentTask = {
        id: `${baseId}-draft`,
        objectiveId: objective.id,
        prospectId: prospect.id,
        type: 'DRAFT_EMAIL',
        status: 'queued',
        priority: objective.priority,
        attempts: 0,
        maxAttempts: 3,
        scheduledAt: new Date(Date.now() + 1000).toISOString(),
        arguments: {
          recipient_email: prospect.contactEmail || `contact@${prospect.companyName.toLowerCase().replace(/\s+/g, '')}.com`,
          email_subject: `${prospect.companyName}: Strategic Growth Collaboration`,
          email_body: `Hi ${prospect.contactName || 'there'},\n\nInterested in exploring how we can streamline outbound sales workflows for ${prospect.companyName}.\n\nBest,`,
          company_name: prospect.companyName
        }
      };
      await saveTask(draftTask);
      createdTasks.push(draftTask);
    }

    return createdTasks;
  }
}
