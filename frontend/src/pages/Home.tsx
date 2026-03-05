import { useState } from "react";
import { Button, Col, Row, Spin, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import ProfileCard from "@/components/ProfileCard";
import CreateProfileModal from "@/components/CreateProfileModal";
import { useProfiles } from "@/hooks/queries/useProfiles";
import { useCreateProfile } from "@/hooks/mutations/useProfiles";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { data: profiles, isLoading } = useProfiles();
  const createProfile = useCreateProfile();
  const [modalOpen, setModalOpen] = useState(false);
  const { canEdit } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Typography.Title level={2} className="mb-0!">
          Profiles
        </Typography.Title>
        {canEdit && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            Create Profile
          </Button>
        )}
      </div>

      {profiles && profiles.length > 0 ? (
        <Row gutter={[16, 16]}>
          {profiles.map((profile) => (
            <Col key={profile.id} xs={24} sm={12} md={8} lg={6}>
              <ProfileCard profile={profile} />
            </Col>
          ))}
        </Row>
      ) : (
        <Typography.Text type="secondary" className="block text-center py-12">
          No profiles yet. Create one to start tracking mod versions.
        </Typography.Text>
      )}

      <CreateProfileModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => {
          createProfile.mutate(data, {
            onSuccess: () => setModalOpen(false),
          });
        }}
        loading={createProfile.isPending}
      />
    </div>
  );
}
