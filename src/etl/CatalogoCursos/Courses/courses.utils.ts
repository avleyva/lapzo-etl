import { VdmLMSUser } from '../../Users/users.types';

export const getCourseAuthor = async (
  // jsonData: string,
  subdomain: string,
  createdByJson: any,
  vdmLMSUsers: VdmLMSUser[],
): Promise<string | null> => {
  // const createdByJson = JSON.parse(jsonData);

  let lmsLMSUser = vdmLMSUsers.find((e: VdmLMSUser) =>
    e?.legacy_user_fb === createdByJson?.uid ? e.id : null,
  );

  if (!lmsLMSUser) {
    lmsLMSUser = vdmLMSUsers.find((e: VdmLMSUser) =>
      e?.email === `generic_instructor@${subdomain}.com` ? e.id : null,
    );
  }

  return lmsLMSUser?.id || null;
};

export const getCourseDifficulty = (difficulty: number): string => {
  return difficulty === 2 ? 'medium' : difficulty === 3 ? 'advanced' : 'easy';
};
