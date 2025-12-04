import { useState, useEffect } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import { Tag, Plus, Package } from "lucide-react";
import TagCard from "./TagCard";
import CreateTagModal from "./CreateTagModal";
import EditTagModal from "./EditTagModal";
import DeleteConfirmationModal from "../../../components/modals/DeleteConfirmationModal";
import { buildApiUrl } from "../../../config/api.config";

const TagsManagement = () => {
  const { theme } = useTheme();
  const [tags, setTags] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl("api/settings.php?type=tags"), {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTags(data.data);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTag = async (tagData) => {
    try {
      const response = await fetch(buildApiUrl("api/settings.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "create_tag",
          name: tagData.name,
          color: tagData.color,
          description: tagData.description,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        await fetchTags();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error creating tag:", error);
      return false;
    }
  };

  const handleUpdateTag = async (tagData) => {
    try {
      const response = await fetch(buildApiUrl("api/settings.php"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "update_tag",
          id: selectedTag.id,
          name: tagData.name,
          color: tagData.color,
          description: tagData.description,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        await fetchTags();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating tag:", error);
      return false;
    }
  };

  const handleToggleTag = async (tag) => {
    try {
      const response = await fetch(buildApiUrl("api/settings.php"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "toggle_tag",
          id: tag.id,
          is_active: !tag.is_active, // Toggle the current state
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        await fetchTags();
      }
    } catch (error) {
      console.error("Error toggling tag:", error);
    }
  };

  const handleDeleteTag = async () => {
    try {
      const response = await fetch(buildApiUrl("api/settings.php"), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "delete_tag",
          id: selectedTag.id,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        await fetchTags();
        setIsDeleteModalOpen(false);
        setSelectedTag(null);
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  };

  const handleEdit = (tag) => {
    setSelectedTag(tag);
    setIsEditModalOpen(true);
  };

  const handleDelete = (tag) => {
    setSelectedTag(tag);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className={`${theme.bgCard} ${theme.shadow} rounded-xl p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className={`text-2xl font-bold ${theme.textPrimary} flex items-center gap-2`}
          >
            <Tag size={24} />
            Tags Management
          </h2>
          <p className={`${theme.textSecondary} mt-1 text-sm`}>
            Create and manage tags for organizing your data
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition"
        >
          <Plus size={18} />
          Create Tag
        </button>
      </div>

      {/* Tags Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className={theme.textSecondary}>Loading tags...</p>
        </div>
      ) : tags.length === 0 ? (
        <div className="text-center py-12">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${theme.bgAccent} mb-4`}
          >
            <Package size={32} className={theme.textSecondary} />
          </div>
          <h3 className={`text-xl font-semibold ${theme.textPrimary} mb-2`}>
            No Tags Yet
          </h3>
          <p className={`${theme.textSecondary} mb-6`}>
            Create your first tag to start organizing your data
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition"
          >
            <Plus size={18} />
            Create Tag
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tags.map((tag) => (
            <TagCard
              key={tag.id}
              tag={tag}
              onEdit={handleEdit}
              onToggle={handleToggleTag}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateTagModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateTag}
      />

      <EditTagModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTag(null);
        }}
        onSave={handleUpdateTag}
        tag={selectedTag}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTag(null);
        }}
        onConfirm={handleDeleteTag}
        title="Delete Tag"
        message={`Are you sure you want to delete the tag "${selectedTag?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default TagsManagement;
