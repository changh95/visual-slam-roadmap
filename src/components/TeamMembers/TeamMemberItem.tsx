import { MailIcon } from '../ReactIcons/MailIcon';
import { MemberActionDropdown } from './MemberActionDropdown';
import { MemberRoleBadge } from './RoleBadge';
import type { TeamMemberItem } from './TeamMembersPage';
import { $canManageCurrentTeam } from '../../stores/team';
import { useStore } from '@nanostores/react';

type TeamMemberProps = {
  member: TeamMemberItem;
  userId: string;
  index: number;
  teamId: string;
  canManageCurrentTeam: boolean;
  onDeleteMember: () => void;
  onUpdateMember: () => void;
  onSendProgressReminder: () => void;
  onResendInvite: () => void;
};

export function TeamMemberItem(props: TeamMemberProps) {
  const {
    member,
    index,
    onResendInvite,
    onUpdateMember,
    canManageCurrentTeam,
    userId,
    onDeleteMember,
    onSendProgressReminder,
  } = props;

  const canManageTeam = useStore($canManageCurrentTeam);
  const showNoProgressBadge = !member.hasProgress && member.status === 'joined';
  const allowProgressReminder =
    canManageTeam &&
    !member.hasProgress &&
    member.status === 'joined' &&
    member.userId !== userId;

  return (
    <div
      className={`flex items-center justify-between gap-2 p-3 ${
        index === 0 ? '' : 'border-t'
      }`}
    >
      <div className="flex items-center gap-3">
        <img
          src={
            member.avatar
              ? `${import.meta.env.PUBLIC_AVATAR_BASE_URL}/${member.avatar}`
              : '/images/default-avatar.png'
          }
          alt={member.name || ''}
          className="hidden h-10 w-10 rounded-full sm:block"
        />
        <div>
          <div className="mb-1 flex items-center gap-2 sm:hidden">
            <MemberRoleBadge role={member.role} />
          </div>
          <div className="flex items-center">
            <h3 className="inline-grid grid-cols-[auto_auto_auto] items-center font-medium">
              <span className="truncate">{member.name}</span>
              {showNoProgressBadge && (
                <span className="ml-2 rounded-full bg-red-400 px-2 py-0.5 text-xs font-normal text-white">
                  No Progress
                </span>
              )}
              {member.userId === userId && (
                <span className="ml-2 hidden text-xs font-normal text-blue-500 sm:inline">
                  You
                </span>
              )}
            </h3>
            <div className="ml-2 flex items-center gap-0.5">
              {member.status === 'invited' && (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                  Invited
                </span>
              )}
              {member.status === 'rejected' && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                  Rejected
                </span>
              )}
            </div>
          </div>
          <p className="truncate text-sm text-gray-500">
            {member.invitedEmail}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center text-sm">
        <span className={'hidden sm:block'}>
          <MemberRoleBadge role={member.role} />
        </span>
        {canManageCurrentTeam && (
          <MemberActionDropdown
            allowUpdateRole={member.status !== 'rejected'}
            allowProgressReminder={allowProgressReminder}
            onResendInvite={onResendInvite}
            onSendProgressReminder={onSendProgressReminder}
            onDeleteMember={onDeleteMember}
            isDisabled={member.userId === userId}
            onUpdateMember={onUpdateMember}
            member={member}
          />
        )}
      </div>
    </div>
  );
}