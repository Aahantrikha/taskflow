import { useStore } from '@/store/useStore';

/**
 * Returns helpers for role-based access control.
 * - isAdmin: true if the logged-in user has the 'admin' role
 * - isMember: true if the logged-in user has the 'member' role
 * - canManageTasks: admins can create/delete/assign any task; members can only update their own
 * - canManageProjects: only admins can create projects and manage members
 * - isAssignedTo: checks if the current user is the assignee of a given task
 */
export function useRole() {
  const { user } = useStore();
  const isAdmin = user?.role === 'admin';
  const isProjectLead = user?.role === 'project_lead';
  const isQualityReviewer = user?.role === 'quality_reviewer';
  const isTasker = user?.role === 'tasker';

  // Can manage projects, tasks, and members
  const canManage = isAdmin || isProjectLead;
  // Can review/change status of any task
  const canReview = isAdmin || isProjectLead || isQualityReviewer;

  const isAssignedTo = (assigneeId: string | undefined | null) =>
    !!user && assigneeId === user.id;

  return {
    isAdmin,
    isProjectLead,
    isQualityReviewer,
    isTasker,
    canManageTasks: canManage,
    canManageProjects: canManage,
    canReviewTasks: canReview,
    canUpdateOwnTask: (assigneeId: string | undefined | null) =>
      canManage || canReview || isAssignedTo(assigneeId),
    isAssignedTo,
    user,
  };
}
