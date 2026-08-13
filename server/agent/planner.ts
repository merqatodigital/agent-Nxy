import { AgentObjective, AgentTask } from './types.js';
import { saveTask } from './store.js';
import { registerSalesRuntimeTools } from '../sales/runtimeTools.js';

// Register deterministic sales tools once when the planner/runtime module loads.
registerSalesRuntimeTools();

export class AgentPlanner {
  /**
   * Plans concrete operational tasks without inventing prospects or contacts.
   * If no prospects are supplied, Nyx creates a discovery task and waits for
   * sourced candidates instead of fabricating a default company.
   */
  public async planObjectiveTasks(
    objective: AgentObjective,
    prospects: any[] = []
  ): Promise<AgentTask[]> {
    const createdTasks: AgentTask[] = [];
    const now = Date.now();

    if (!prospects.length) {
      const discoveryTask: AgentTask = {
        id: `task-${now}-${Math.random().toString(36).substring(2, 6)}-discover`,
        objectiveId: objective.id,
        type: 'DISCOVER_PROSPECTS',
        status: 'queued',
        priority: objective.priority,
        attempts: 0,
        maxAttempts: 3,
        scheduledAt: new Date().toISOString(),
        arguments: {
          keywords: [objective.instruction],
          maximumResults: 25,
          excludeDomains: []
        }
      };
      await saveTask(discoveryTask);
      createdTasks.push(discoveryTask);
      return createdTasks;
    }

    for (const prospect of prospects) {
      if (!prospect?.companyName) continue;

      const timestamp = new Date().toISOString();
      const baseId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const website = String(prospect.website || '').trim();
      const contactEmail = String(prospect.contactEmail || '').trim();

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
          domain: website || undefined
        }
      };
      await saveTask(crmTask);
      createdTasks.push(crmTask);

      if (website) {
        const researchTask: AgentTask = {
          id: `${baseId}-research`,
          objectiveId: objective.id,
          prospectId: prospect.id,
          type: 'WEB_RESEARCH',
          status: 'queued',
          priority: objective.priority,
          attempts: 0,
          maxAttempts: 3,
          scheduledAt: new Date(Date.now() + 500).toISOString(),
          arguments: {
            url: website,
            maxPages: 8
          }
        };
        await saveTask(researchTask);
        createdTasks.push(researchTask);
      }

      // Never manufacture an email address. Drafting is only queued for a real
      // supplied/public contact and remains approval-gated by the tool policy.
      if (contactEmail) {
        const draftTask: AgentTask = {
          id: `${baseId}-draft`,
          objectiveId: objective.id,
          prospectId: prospect.id,
          type: 'DRAFT_EMAIL',
          status: 'queued',
          priority: objective.priority,
          attempts: 0,
          maxAttempts: 2,
          scheduledAt: new Date(Date.now() + 1500).toISOString(),
          arguments: {
            recipient_email: contactEmail,
            recipient_name: prospect.contactName || undefined,
            company_name: prospect.companyName,
            source_url: website || undefined,
            email_subject: `${prospect.companyName}: quick question`,
            email_body: `Hi ${prospect.contactName || 'there'},\n\nI prepared this draft for operator review after Nyx researches ${prospect.companyName}.\n\nBest,`
          }
        };
        await saveTask(draftTask);
        createdTasks.push(draftTask);
      }
    }

    return createdTasks;
  }
}
