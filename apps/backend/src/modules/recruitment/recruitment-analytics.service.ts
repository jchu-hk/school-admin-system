import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecruitmentApplication } from './recruitment-application.entity';
import { RecruitmentPosition } from './recruitment-position.entity';
import { RecruitmentInterview } from './recruitment-interview.entity';

@Injectable()
export class RecruitmentAnalyticsService {
  constructor(
    @InjectRepository(RecruitmentApplication)
    private readonly appRepo: Repository<RecruitmentApplication>,
    @InjectRepository(RecruitmentPosition)
    private readonly posRepo: Repository<RecruitmentPosition>,
    @InjectRepository(RecruitmentInterview)
    private readonly intRepo: Repository<RecruitmentInterview>,
  ) {}

  async getDashboard() {
    const [positions, applications, interviews] = await Promise.all([
      this.posRepo.find(),
      this.appRepo.find(),
      this.intRepo.find(),
    ]);

    // Status distribution
    const statusDist: Record<string, number> = {};
    for (const app of applications) {
      statusDist[app.status] = (statusDist[app.status] || 0) + 1;
    }

    // Applications by position
    const byPosition: Record<
      string,
      { total: number; byStatus: Record<string, number> }
    > = {};
    for (const app of applications) {
      const posTitle = app.position?.title || '未知职位';
      if (!byPosition[posTitle]) {
        byPosition[posTitle] = { total: 0, byStatus: {} };
      }
      byPosition[posTitle].total++;
      byPosition[posTitle].byStatus[app.status] =
        (byPosition[posTitle].byStatus[app.status] || 0) + 1;
    }

    // Applications over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentApps = applications.filter(
      (a) => new Date(a.submittedAt || a.createdAt) >= thirtyDaysAgo,
    );

    // Weekly submissions
    const weeklyData: Record<string, number> = {};
    for (const app of recentApps) {
      const date = new Date(app.submittedAt || app.createdAt);
      const weekStart = this.getWeekStart(date);
      const key = weekStart.toISOString().split('T')[0];
      weeklyData[key] = (weeklyData[key] || 0) + 1;
    }

    // Interview statistics
    const interviewStats = {
      total: interviews.length,
      scheduled: interviews.filter((i) => i.status === 'SCHEDULED').length,
      completed: interviews.filter((i) => i.status === 'COMPLETED').length,
      cancelled: interviews.filter((i) => i.status === 'CANCELLED').length,
    };

    // Position statistics
    const positionStats = {
      total: positions.length,
      draft: positions.filter((p) => p.status === 'DRAFT').length,
      published: positions.filter((p) => p.status === 'PUBLISHED').length,
      paused: positions.filter((p) => p.status === 'PAUSED').length,
      closed: positions.filter((p) => p.status === 'CLOSED').length,
    };

    // Offer statistics
    const offerStats = {
      total: applications.filter((a) => a.status === 'OFFER').length,
      totalApplications: applications.length,
      offerRate:
        applications.length > 0
          ? (
              (applications.filter((a) => a.status === 'OFFER').length /
                applications.length) *
              100
            ).toFixed(1) + '%'
          : '0%',
    };

    // Conversion rates
    const newApps = applications.length;
    const screenedApps =
      (statusDist['SCREENING'] || 0) +
      (statusDist['SHORTLISTED'] || 0) +
      (statusDist['INTERVIEW'] || 0) +
      (statusDist['OFFER'] || 0) +
      (statusDist['REJECTED'] || 0);
    const shortlistedApps =
      (statusDist['SHORTLISTED'] || 0) +
      (statusDist['INTERVIEW'] || 0) +
      (statusDist['OFFER'] || 0);
    const interviewedApps =
      (statusDist['INTERVIEW'] || 0) + (statusDist['OFFER'] || 0);

    return {
      overview: {
        totalPositions: positions.length,
        totalApplications: applications.length,
        totalInterviews: interviews.length,
      },
      positionStats,
      applicationStats: {
        total: applications.length,
        byStatus: statusDist,
        byPosition,
        weeklySubmissions: weeklyData,
      },
      interviewStats,
      offerStats,
      conversionRates: {
        screeningRate:
          newApps > 0
            ? ((screenedApps / newApps) * 100).toFixed(1) + '%'
            : '0%',
        shortlistRate:
          screenedApps > 0
            ? ((shortlistedApps / screenedApps) * 100).toFixed(1) + '%'
            : '0%',
        interviewRate:
          shortlistedApps > 0
            ? ((interviewedApps / shortlistedApps) * 100).toFixed(1) + '%'
            : '0%',
        offerRate:
          interviewedApps > 0
            ? (
                (applications.filter((a) => a.status === 'OFFER').length /
                  interviewedApps) *
                  100 || 0
              ).toFixed(1) + '%'
            : '0%',
        overallConversion:
          newApps > 0
            ? (
                (applications.filter((a) => a.status === 'OFFER').length /
                  newApps) *
                100
              ).toFixed(2) + '%'
            : '0%',
      },
    };
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
