import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RecruitmentApplication,
  ApplicationStatus,
} from './recruitment-application.entity';
import { RecruitmentInterview } from './recruitment-interview.entity';
import {
  RecruitmentActivityLog,
  ActivityType,
} from './recruitment-activity-log.entity';

@Injectable()
export class RecruitmentWorkflowService {
  constructor(
    @InjectRepository(RecruitmentApplication)
    private readonly appRepo: Repository<RecruitmentApplication>,
    @InjectRepository(RecruitmentInterview)
    private readonly interviewRepo: Repository<RecruitmentInterview>,
    @InjectRepository(RecruitmentActivityLog)
    private readonly logRepo: Repository<RecruitmentActivityLog>,
  ) {}

  // Get workflow status for an application
  async getWorkflowStatus(applicationId: string) {
    const application = await this.appRepo.findOne({
      where: { id: applicationId },
      relations: ['position'],
    });

    if (!application) {
      return null;
    }

    const interviews = await this.interviewRepo.find({
      where: { applicationId },
      order: { createdAt: 'ASC' },
    });

    const logs = await this.logRepo.find({
      where: { applicationId },
      order: { createdAt: 'ASC' },
    });

    return {
      applicationId: application.id,
      applicantName: application.applicantName,
      position: application.position?.title,
      currentStatus: application.status,
      pipelineStage: this.getPipelineStage(application.status),
      interviews: interviews.map((i) => ({
        id: i.id,
        interviewDate: i.interviewDate,
        status: i.status,
        type: i.interviewType,
      })),
      activityLogs: logs.map((l) => ({
        type: l.activityType,
        description: l.description,
        performedBy: l.performedBy,
        createdAt: l.createdAt,
      })),
    };
  }

  // Get pipeline overview
  async getPipelineOverview() {
    const statusCounts = await this.appRepo
      .createQueryBuilder('app')
      .select('app.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('app.status')
      .getRawMany();

    const statusMap: Record<string, number> = {};
    for (const row of statusCounts) {
      statusMap[row.status] = parseInt(row.count);
    }

    return {
      total: Object.values(statusMap).reduce((a, b) => a + b, 0),
      byStatus: {
        [ApplicationStatus.NEW]: statusMap[ApplicationStatus.NEW] || 0,
        [ApplicationStatus.SCREENING]:
          statusMap[ApplicationStatus.SCREENING] || 0,
        [ApplicationStatus.SHORTLISTED]:
          statusMap[ApplicationStatus.SHORTLISTED] || 0,
        [ApplicationStatus.INTERVIEW]:
          statusMap[ApplicationStatus.INTERVIEW] || 0,
        [ApplicationStatus.REJECTED]:
          statusMap[ApplicationStatus.REJECTED] || 0,
        [ApplicationStatus.OFFER]: statusMap[ApplicationStatus.OFFER] || 0,
      },
      pipelineStages: {
        newApplicants: statusMap[ApplicationStatus.NEW] || 0,
        screening: statusMap[ApplicationStatus.SCREENING] || 0,
        shortlisted: statusMap[ApplicationStatus.SHORTLISTED] || 0,
        inInterview: statusMap[ApplicationStatus.INTERVIEW] || 0,
        offerExtended: statusMap[ApplicationStatus.OFFER] || 0,
        rejected: statusMap[ApplicationStatus.REJECTED] || 0,
      },
    };
  }

  // Get time statistics
  async getTimeStats(positionId?: string) {
    const qb = this.appRepo.createQueryBuilder('app');
    if (positionId) {
      qb.where('app.positionId = :positionId', { positionId });
    }

    const apps = await qb.getMany();

    const stats = {
      avgTimeToScreen: 0,
      avgTimeToShortlist: 0,
      avgTimeToInterview: 0,
      avgTimeToOffer: 0,
      totalApplications: apps.length,
    };

    const calcDays = (start: Date, end: Date) => {
      return Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );
    };

    let screenDays = 0,
      shortlistDays = 0,
      interviewDays = 0,
      offerDays = 0;
    let screenCount = 0,
      shortlistCount = 0,
      interviewCount = 0,
      offerCount = 0;

    for (const app of apps) {
      const submitted = new Date(app.submittedAt || app.createdAt);

      if (app.status !== ApplicationStatus.NEW) {
        const updated = new Date(app.updatedAt);
        screenDays += calcDays(submitted, updated);
        screenCount++;
      }

      if (
        app.status === ApplicationStatus.SHORTLISTED ||
        app.status === ApplicationStatus.INTERVIEW ||
        app.status === ApplicationStatus.OFFER
      ) {
        const updated = new Date(app.updatedAt);
        shortlistDays += calcDays(submitted, updated);
        shortlistCount++;
      }

      if (
        app.status === ApplicationStatus.INTERVIEW ||
        app.status === ApplicationStatus.OFFER
      ) {
        const updated = new Date(app.updatedAt);
        interviewDays += calcDays(submitted, updated);
        interviewCount++;
      }

      if (app.status === ApplicationStatus.OFFER) {
        const updated = new Date(app.updatedAt);
        offerDays += calcDays(submitted, updated);
        offerCount++;
      }
    }

    stats.avgTimeToScreen =
      screenCount > 0 ? Math.round(screenDays / screenCount) : 0;
    stats.avgTimeToShortlist =
      shortlistCount > 0 ? Math.round(shortlistDays / shortlistCount) : 0;
    stats.avgTimeToInterview =
      interviewCount > 0 ? Math.round(interviewDays / interviewCount) : 0;
    stats.avgTimeToOffer =
      offerCount > 0 ? Math.round(offerDays / offerCount) : 0;

    return stats;
  }

  // Log an activity
  async logActivity(
    applicationId: string,
    type: ActivityType,
    description: string,
    performedBy?: string,
    oldValue?: string,
    newValue?: string,
    metadata?: Record<string, any>,
  ) {
    const log = this.logRepo.create({
      applicationId,
      activityType: type,
      description,
      performedBy: performedBy || 'system',
      oldValue,
      newValue,
      metadata,
    });
    return this.logRepo.save(log);
  }

  // Get application timeline
  async getApplicationTimeline(applicationId: string) {
    const logs = await this.logRepo.find({
      where: { applicationId },
      order: { createdAt: 'ASC' },
    });

    const interviews = await this.interviewRepo.find({
      where: { applicationId },
      order: { createdAt: 'ASC' },
    });

    // Combine and sort all events
    const events: Array<{
      type: string;
      timestamp: Date;
      description: string;
      performedBy?: string;
    }> = [];

    for (const log of logs) {
      events.push({
        type: log.activityType,
        timestamp: log.createdAt,
        description: log.description,
        performedBy: log.performedBy,
      });
    }

    for (const interview of interviews) {
      events.push({
        type: `INTERVIEW_${interview.status}`,
        timestamp: new Date(interview.interviewDate),
        description: `${interview.status === 'SCHEDULED' ? '安排' : interview.status === 'COMPLETED' ? '完成' : '取消'}面试: ${new Date(interview.interviewDate).toLocaleString('zh-HK')}`,
        performedBy: interview.interviewers.join(', '),
      });
    }

    // Sort by timestamp
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return events;
  }

  private getPipelineStage(status: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.NEW:
        return 'new';
      case ApplicationStatus.SCREENING:
        return 'screening';
      case ApplicationStatus.SHORTLISTED:
        return 'shortlisted';
      case ApplicationStatus.INTERVIEW:
        return 'interview';
      case ApplicationStatus.OFFER:
        return 'offer';
      case ApplicationStatus.REJECTED:
        return 'rejected';
      default:
        return 'unknown';
    }
  }
}
