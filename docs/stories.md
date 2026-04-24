# FlowManager - User Stories

111 stories organized by module.
Each story defines the expected behavior and served as the basis for the Day 3 testing phase.

---

## Authentication

```
1.  As a visitor, I want to create an account with name, email, and password,
    so that I can access FlowManager.

2.  As a visitor, I want to confirm my email by clicking the link I receive,
    so that I can activate my account.

3.  As a visitor, I want to log in with email and password,
    so that I can access my account.

4.  As a visitor, I want to request a password reset,
    so that I can regain access if I forget my password.

5.  As a visitor, I want to reset my password through the received link,
    so that I can recover access to my account.

6.  As an authenticated user, I want my session to be renewed automatically,
    so that I do not need to log in again every 15 minutes.

7.  As an authenticated user, I want to log out,
    so that I can end my session securely.
```

---

## Profile

```
8.  As an authenticated user, I want to view my profile,
    so that I can see my registered information.

9.  As an authenticated user, I want to edit my name,
    so that I can keep my profile up to date.

10. As an authenticated user, I want to upload a profile photo,
    so that I can personalize my identity in the system.

11. As an authenticated user, I want to remove my profile photo,
    so that I can return to the default automatically generated avatar.

12. As an authenticated user, I want to change my password,
    so that I can keep my account secure.

13. As an authenticated user, I want to set my time zone,
    so that deadlines and notifications appear in the correct local time.
```

---

## Workspaces

```
14. As an authenticated user, I want to create a workspace with name,
    description, color, and logo, so that I can organize my projects in a dedicated environment.

15. As an authenticated user, I want to view all workspaces
    that I belong to, so that I can quickly access any of them.

16. As a super admin, I want to edit the workspace name, description, color, and logo,
    so that I can keep its information up to date.

17. As a super admin, I want to transfer the super admin role
    to another admin, so that I can delegate workspace ownership.

18. As a super admin, I want to delete the workspace,
    so that I can close an environment that is no longer needed.

19. As a super admin or admin, I want to invite someone by email
    while choosing their role, so that I can expand the workspace team.

20. As a super admin or admin, I want to view all workspace members
    with their roles, so that I can manage the team.

21. As a super admin or admin, I want to promote a member to admin,
    so that I can give them more responsibility.

22. As a super admin, I want to demote an admin to member,
    so that I can adjust permissions when necessary.

23. As a super admin, I want to remove any member from the workspace,
    so that I can control who has access to the environment.

24. As a super admin or admin, I want to see the status of sent invitations,
    so that I know who accepted and who has not responded yet.

25. As a visitor, I want to accept a workspace invitation through the received link,
    so that I can join the team without being added manually.

26. As a visitor, I want to decline a workspace invitation,
    so that I can communicate that I will not participate.
```

---

## Projects

```
27. As a super admin or admin, I want to create a project with name,
    description, color, and deadline, so that I can organize related tasks.

28. As a workspace member, I want to view all active projects
    in the workspace, so that I have an overview of ongoing work.

29. As a super admin or admin, I want to edit the project name, description, color,
    deadline, and owner, so that I can keep the information up to date.

30. As a super admin or admin, I want to archive a project,
    so that I can remove it from the main listing without deleting it permanently.

31. As a workspace member, I want to view archived projects,
    so that I can consult the history of completed projects.

32. As a super admin or admin, I want to unarchive a project,
    so that I can reactivate it when needed.

33. As a super admin, I want to permanently delete a project,
    so that I can remove a project that is no longer useful.
```

---

## Tasks

```
34. As a super admin or admin, I want to create a task with title,
    description, priority, and optional deadline inside a project,
    so that I can register a deliverable to be completed.

35. As a workspace member, I want to view all tasks
    in a project, so that I can follow the progress of the work.

36. As a workspace member, I want to view the details
    of a specific task, so that I can understand what needs to be done.

37. As a super admin or admin, I want to edit the title, description,
    priority, deadline, and assignee of a task,
    so that I can keep the information up to date.

38. As a super admin or admin, I want to reorder tasks
    inside a project, so that I can organize them by relevance.

39. As a super admin or admin, I want to move a task to another project,
    so that I can reorganize work when needed.

40. As a super admin or admin, I want to assign a task directly
    to a member, so that I can define the main person responsible.

41. As a super admin or admin, I want to manually change the status
    of a task, so that I can reflect situations not covered by steps.

42. As the system, I want to mark a task as completed automatically
    when all steps are completed, so that the status stays up to date.

43. As the system, I want to revert a task status back to in progress
    when a step is reopened, as long as the status was not manually defined.

44. As a super admin or admin, I want to add labels to a task,
    so that I can categorize it and make filtering easier.

45. As a super admin or admin, I want to remove labels from a task,
    so that I can keep its categorization up to date.

46. As a workspace member, I want to follow a task as a watcher,
    so that I can receive notifications about changes without being assigned.

47. As a workspace member, I want to stop following a task,
    so that I no longer receive notifications about it.

48. As a super admin or admin, I want to delete a task,
    so that I can remove deliverables that are no longer necessary.
```

---

## Steps

```
49. As a super admin or admin, I want to create a step inside a task
    with title, description, and optional deadline, so that I can break work into smaller parts.

50. As a super admin or admin, I want to assign a step to one or more members,
    so that I can define who is responsible for each part.

51. As an assigned member, I want to view all steps assigned to me,
    so that I know exactly what I need to do.

52. As an assigned member, I want to mark a step as in progress,
    so that I can signal that I have started working on it.

53. As an assigned member, I want to mark a step as completed,
    so that I can signal that I finished my part.

54. As a super admin or admin, I want to reopen a completed step,
    so that I can revisit a stage that needs to be redone.

55. As a super admin or admin, I want to reorder the steps of a task,
    so that I can adjust the execution sequence.

56. As a super admin or admin, I want to edit the title, description, and deadline
    of a step, so that I can keep the information up to date.

57. As a super admin or admin, I want to remove a member from a step,
    so that I can adjust assignments when necessary.

58. As a super admin or admin, I want to delete a step,
    so that I can remove stages that are no longer necessary.

59. As the system, I want to prevent a step from being created or edited
    with a deadline later than the task deadline, so that deadline consistency is preserved.

60. As a super admin or admin, I want to be warned when shortening a task deadline
    to a date earlier than the deadline of an existing step,
    so that I can adjust affected step deadlines.
```

---

## Comments

```
61. As a workspace member, I want to add a comment to a task,
    so that I can communicate relevant information in the context of the work.

62. As a workspace member, I want to reply to an existing comment,
    so that I can keep conversations organized in threads.

63. As a workspace member, I want to mention another member with @name
    in a comment, so that I can call a specific person's attention.

64. As the comment author, I want to edit my own comment,
    so that I can correct information or update its content.

65. As a workspace member, I want to see when a comment
    was edited, so that I know the content changed after publication.

66. As the comment author, I want to delete my own comment,
    so that I can remove information that is no longer relevant.

67. As a super admin or admin, I want to delete any comment,
    so that I can moderate content when necessary.

68. As a workspace member, I want to see a message in place of
    deleted comments, so that I can understand the thread context.
```

---

## Labels

```
69. As a super admin or admin, I want to create a label with name and color,
    so that I can categorize tasks visually.

70. As a workspace member, I want to view all available labels,
    so that I know which categories exist.

71. As a super admin or admin, I want to edit the name and color of a label,
    so that I can keep categorization up to date.

72. As a super admin or admin, I want to delete a workspace label,
    so that I can remove categories that are no longer used.

73. As a super admin or admin, I want to add one or more labels to a task,
    so that I can categorize it visually.

74. As a super admin or admin, I want to remove a label from a task,
    so that I can update its categorization.

75. As a workspace member, I want to filter tasks by label,
    so that I can quickly find tasks from a specific category.
```

---

## Invitations

```
76. As a super admin or admin, I want to invite someone by email
    while choosing their role, so that I can grow the team.

77. As a super admin or admin, I want to view all sent invitations
    with their statuses, so that I can track who accepted and who did not respond.

78. As a super admin or admin, I want to cancel a pending invitation,
    so that I can revoke an invitation that is no longer necessary.

79. As a super admin or admin, I want to resend an expired invitation,
    so that I can give someone another chance to respond in time.

80. As a visitor, I want to accept an invitation through the received link,
    so that I can join the workspace without being added manually.

81. As a visitor without an account, I want to create my account during invitation acceptance,
    so that I can join the workspace without separate registration.

82. As a visitor, I want to decline an invitation,
    so that I can communicate that I will not join the workspace.

83. As the system, I want to automatically mark invitations as expired
    when their deadline passes, so that statuses stay current.

84. As the system, I want to record when the invited person viewed the link,
    so that the admin knows the email was opened.
```

---

## Notifications

```
85. As a workspace member, I want to receive an email when a step
    is assigned to me, so that I know I have a new responsibility.

86. As a workspace member, I want to receive an email when the deadline of
    a task I participate in is approaching, so that I can plan ahead.

87. As a workspace member, I want to receive an email when the deadline of
    a step assigned to me is approaching, so that I can plan ahead.

88. As a workspace member, I want to receive an email when the status of
    a task I participate in changes, so that I can follow progress.

89. As a workspace member, I want to receive an email when I am invited
    to a workspace, so that I can accept or decline the invitation.

90. As a workspace member, I want to receive an email when I am mentioned
    in a comment, so that I am notified about directed messages.

91. As the system, I want to retry failed email deliveries,
    so that important notifications still have a chance to be delivered.
```

---

## Dashboard

```
92. As a workspace member, I want to view the total number of tasks by status
    across all my workspaces, so that I have an overview of progress.

93. As a workspace member, I want to view overdue tasks,
    so that I can identify what is behind schedule.

94. As a workspace member, I want to view completion rate
    by project, so that I can understand which projects are more advanced.

95. As a workspace member, I want to view workload
    by member, so that I can identify who is overloaded.
```

---

## History

```
96. As a workspace member, I want to view the complete activity history
    of a task, so that I can understand everything that happened in it.

97. As a workspace member, I want to view the complete activity history
    of a project, so that I can follow all actions performed there.

98. As a workspace member, I want to filter activity history by period,
    so that I can find activity from a specific date range.

99. As a workspace member, I want to filter activity history by member,
    so that I can see actions performed by a specific person.

100. As a workspace member, I want to filter activity history by action type,
     so that I can find specific events such as creations or status changes.
```

---

## System

```
101. As the system, I want to permanently delete workspaces that have been soft deleted
     for more than 30 days, so that I can free storage and keep the database clean.

102. As the system, I want to permanently delete notifications older than
     90 days, so that I can keep the database clean without losing relevant recent data.

103. As the system, I want to delete revoked tokens whose expiration has passed,
     so that I can keep the blacklist lean.

104. As the system, I want to automatically mark invitations as expired
     when their deadline passes, so that statuses always remain correct.

105. As the system, I want to send deadline reminders to members with
     tasks or steps approaching due dates, so that they can plan ahead.

106. As the system, I want to retry failed notifications
     automatically every hour, respecting the maximum of 3 attempts.

107. As the system, I want to prevent a step from having a deadline
     later than its task deadline, so that deadline consistency is guaranteed.

108. As the system, I want to warn the admin when a task deadline
     is changed to a date earlier than one or more existing step deadlines,
     so that affected steps can be adjusted.

109. As the system, I want to automatically recalculate step ordering
     when a step is deleted, so that the sequence has no gaps.

110. As the system, I want to keep steps unassigned when a
     member is removed from the workspace, so that configured work is not lost.

111. As the system, I want to record all relevant actions in activity history
     with enough context to support full auditing.
```
